import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as path from "path";
import * as fs from "fs";
import * as mime from "mime-types";
import * as dotenv from "dotenv";

// Load root .env if present
const rootEnvPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

const config = new pulumi.Config();
const memorySize = config.getNumber("memorySize") || Number(process.env.LAMBDA_MEMORY_SIZE) || 1536; // 1.5GB
const timeout = config.getNumber("timeout") || Number(process.env.LAMBDA_TIMEOUT) || 60; // 60 seconds
const privateApiKey = process.env.PRIVATE_API_KEY || process.env.API_KEY || config.get("privateApiKey") || config.get("apiKey") || "";
const powDifficulty = process.env.POW_DIFFICULTY || config.get("powDifficulty") || "4";
const webClientSalt = process.env.WEB_CLIENT_SALT || config.get("webClientSalt") || "md2pdf_lite_salt_v1";

// =========================================================================
// 1. ECR Repository & Docker Image Build (Chromium + CJK + md-to-pdf)
// =========================================================================

const ecrRepo = new aws.ecr.Repository("md-to-pdf-repo", {
  name: "md-to-pdf-lite-lambda",
  forceDelete: true,
  imageScanningConfiguration: {
    scanOnPush: true,
  },
});

const image = new awsx.ecr.Image("md-to-pdf-image", {
  repositoryUrl: ecrRepo.repositoryUrl,
  context: path.resolve(__dirname, ".."),
  dockerfile: path.resolve(__dirname, "../Dockerfile.lambda"),
  platform: "linux/amd64",
});

// =========================================================================
// 2. IAM Role for Lambda
// =========================================================================

const lambdaRole = new aws.iam.Role("md-to-pdf-lambda-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment("lambda-basic-execution", {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

// =========================================================================
// 3. Lambda Function & Function URL
// =========================================================================

const lambdaFunc = new aws.lambda.Function("md-to-pdf-function", {
  name: "md-to-pdf-lite-converter",
  packageType: "Image",
  imageUri: image.imageUri,
  role: lambdaRole.arn,
  memorySize: memorySize,
  timeout: timeout,
  architectures: ["x86_64"],
  environment: {
    variables: {
      NODE_ENV: "production",
      PUPPETEER_CACHE_DIR: "/tmp/.cache",
      PRIVATE_API_KEY: privateApiKey,
      POW_DIFFICULTY: powDifficulty,
      WEB_CLIENT_SALT: webClientSalt,
    },
  },
});

const functionUrl = new aws.lambda.FunctionUrl("md-to-pdf-func-url", {
  functionName: lambdaFunc.name,
  authorizationType: "NONE",
  cors: {
    allowCredentials: false,
    allowHeaders: ["*"],
    allowMethods: ["*"],
    allowOrigins: ["*"],
    maxAge: 86400,
  },
});

new aws.lambda.Permission("allow-public-func-url", {
  action: "lambda:InvokeFunctionUrl",
  function: lambdaFunc.name,
  principal: "*",
  functionUrlAuthType: "NONE",
});

new aws.lambda.Permission("allow-public-invoke-func", {
  action: "lambda:InvokeFunction",
  function: lambdaFunc.name,
  principal: "*",
});

// =========================================================================
// 4. S3 Bucket for Frontend Web UI (TipTap Editor)
// =========================================================================

const webBucket = new aws.s3.BucketV2("md-to-pdf-web-bucket", {
  forceDestroy: true,
});

// Upload built frontend assets to S3
const webDistDir = path.resolve(__dirname, "../web/dist");

function uploadDirToS3(dirPath: string, baseDir: string) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      uploadDirToS3(fullPath, baseDir);
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      const mimeType = mime.lookup(fullPath) || "application/octet-stream";

      new aws.s3.BucketObjectv2(`web-asset-${relativePath.replace(/[/\\.]/g, "-")}`, {
        bucket: webBucket.id,
        key: relativePath,
        source: new pulumi.asset.FileAsset(fullPath),
        contentType: mimeType,
      });
    }
  }
}

uploadDirToS3(webDistDir, webDistDir);

// =========================================================================
// 5. CloudFront Origin Access Control (OAC) & Distribution
// =========================================================================

const oac = new aws.cloudfront.OriginAccessControl("web-ui-oac", {
  name: "md-to-pdf-web-oac",
  originAccessControlOriginType: "s3",
  signingBehavior: "always",
  signingProtocol: "sigv4",
});

// Extract hostname from Lambda Function URL (strip https:// and trailing /)
const lambdaOriginHost = functionUrl.functionUrl.apply((url) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "")
);

const distribution = new aws.cloudfront.Distribution("md-to-pdf-cdn", {
  enabled: true,
  isIpv6Enabled: true,
  defaultRootObject: "index.html",
  priceClass: "PriceClass_100",

  origins: [
    // Origin 1: S3 Bucket (Static UI)
    {
      originId: "s3-web-ui",
      domainName: webBucket.bucketRegionalDomainName,
      originAccessControlId: oac.id,
    },
    // Origin 2: Lambda Function URL (Dynamic API)
    {
      originId: "lambda-api",
      domainName: lambdaOriginHost,
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"],
        originReadTimeout: 60,
      },
    },
  ],

  // Default Route: S3 Static Website UI
  defaultCacheBehavior: {
    targetOriginId: "s3-web-ui",
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD"],
    compress: true,
    // Managed-CachingOptimized Cache Policy
    cachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
  },

  // Dynamic Route: /api/* -> Lambda Function URL
  orderedCacheBehaviors: [
    {
      pathPattern: "/api/*",
      targetOriginId: "lambda-api",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      cachedMethods: ["GET", "HEAD"],
      compress: false,
      // Managed-CachingDisabled Policy
      cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
      // Managed-AllViewerExceptHostHeader Policy
      originRequestPolicyId: "b689b0a8-53d0-40ab-baf2-68738e2966ac",
    },
  ],

  customErrorResponses: [
    {
      errorCode: 404,
      responseCode: 200,
      responsePagePath: "/index.html",
      errorCachingMinTtl: 10,
    },
    {
      errorCode: 403,
      responseCode: 200,
      responsePagePath: "/index.html",
      errorCachingMinTtl: 10,
    },
  ],

  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    },
  },

  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
});

// S3 Bucket Policy allowing CloudFront OAC to read objects
new aws.s3.BucketPolicy("web-bucket-policy", {
  bucket: webBucket.id,
  policy: pulumi
    .all([webBucket.arn, distribution.arn])
    .apply(([bucketArn, distArn]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowCloudFrontServicePrincipalReadOnly",
            Effect: "Allow",
            Principal: {
              Service: "cloudfront.amazonaws.com",
            },
            Action: "s3:GetObject",
            Resource: `${bucketArn}/*`,
            Condition: {
              StringEquals: {
                "AWS:SourceArn": distArn,
              },
            },
          },
        ],
      })
    ),
});

// =========================================================================
// 6. Outputs
// =========================================================================

export const cloudFrontUrl = pulumi.interpolate`https://${distribution.domainName}`;
export const cloudFrontDomain = distribution.domainName;
export const directLambdaFunctionUrl = functionUrl.functionUrl;
export const ecrRepositoryUrl = ecrRepo.repositoryUrl;
