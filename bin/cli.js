#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const pc = require('picocolors');
const pkg = require('../package.json');
const { convert } = require('../src/converter');
const { findChromeExecutable } = require('../src/chrome-finder');

program
  .name('md-to-pdf-lite')
  .description('Ultra-lightweight, zero-chromium-bundle Markdown to PDF converter.')
  .version(pkg.version, '-v, --version', 'Output the current version')
  .argument('[files...]', 'Markdown file(s) or glob patterns to convert')
  .option('-o, --output <path>', 'Output PDF file path or directory')
  .option('-f, --format <format>', 'Paper format: A4, Letter, A3, etc.', 'A4')
  .option('-t, --theme <theme>', 'Built-in styling theme: "github" (default), "clean", or "corporate-ja"', 'github')
  .option('-s, --stylesheet <path>', 'Path to custom CSS stylesheet')
  .option('-c, --css <styles>', 'Custom inline CSS rules')
  .option('-l, --landscape', 'Use landscape orientation', false)
  .option('--chrome <path>', 'Path to Chrome/Chromium executable')
  .option('--tagged', 'Generate tagged accessible PDF (increases file size)', false)
  .option('--check-env', 'Check environment and detected Chrome path')
  .action(async (files, options) => {
    // 1. Environment check mode
    if (options.checkEnv) {
      const chrome = options.chrome || findChromeExecutable();
      console.log(pc.bold('\n🔍 Environment Diagnostic:'));
      console.log(`- Node.js: ${pc.green(process.version)}`);
      console.log(`- Platform: ${pc.cyan(process.platform)} (${process.arch})`);
      if (chrome) {
        console.log(`- Chrome / Chromium: ${pc.green('Found')} -> ${pc.dim(chrome)}\n`);
      } else {
        console.log(`- Chrome / Chromium: ${pc.red('Not found!')}\n`);
      }
      return;
    }

    if (!files || files.length === 0) {
      console.log(pc.yellow('⚠️  No input files specified.\n'));
      program.help();
      return;
    }

    // Expand files if needed
    const resolvedFiles = [];
    for (const f of files) {
      const abs = path.resolve(f);
      if (fs.existsSync(abs)) {
        resolvedFiles.push(abs);
      } else {
        console.warn(pc.yellow(`⚠️  File not found: ${f}`));
      }
    }

    if (resolvedFiles.length === 0) {
      console.error(pc.red('❌ No valid files found to convert.'));
      process.exit(1);
    }

    const chromePath = options.chrome || findChromeExecutable();
    if (!chromePath) {
      console.error(pc.red('\n❌ Chrome/Chromium executable not found!'));
      console.error(pc.dim('Please install Google Chrome or specify via --chrome <path> or CHROME_PATH environment variable.\n'));
      process.exit(1);
    }

    console.log(pc.bold(`\n🚀 Converting ${resolvedFiles.length} Markdown document(s) to PDF...`));
    console.log(pc.dim('------------------------------------------------------------'));

    let successCount = 0;
    const startTime = Date.now();

    for (const file of resolvedFiles) {
      const basename = path.basename(file);
      let outPath = options.output;

      if (outPath) {
        // If output is an existing directory or ends with a slash
        if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
          outPath = path.join(outPath, basename.replace(/\.md$/i, '.pdf'));
        }
      }

      process.stdout.write(`⏳ ${pc.cyan(basename)} ... `);
      const fileStart = Date.now();

      try {
        const result = await convert({
          input: file,
          output: outPath,
          theme: options.theme,
          format: options.format,
          landscape: options.landscape,
          css: options.css,
          stylesheet: options.stylesheet,
          executablePath: chromePath,
          tagged: options.tagged
        });

        const elapsed = ((Date.now() - fileStart) / 1000).toFixed(1);
        const outName = path.basename(result.pdfPath);
        console.log(`${pc.green('✔ Done')} -> ${pc.dim(outName)} (${elapsed}s)`);
        successCount++;
      } catch (err) {
        console.log(`${pc.red('✘ Failed')}`);
        console.error(pc.red(`   Error: ${err.message}`));
      }
    }

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(pc.dim('------------------------------------------------------------'));
    console.log(pc.bold(`🎉 Finished! Successfully converted ${successCount}/${resolvedFiles.length} file(s) in ${totalElapsed}s.\n`));

    if (successCount < resolvedFiles.length) {
      process.exit(1);
    }
  });

program.parse(process.argv);
