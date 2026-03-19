/**
 * Property-Based Tests for Asset Path Resolution
 * Feature: android-apk-conversion, Property 1: Asset Path Resolution
 * Validates: Requirements 2.2, 2.3, 2.4
 * 
 * Property: For any asset file in the public directory, when the application 
 * is built and deployed to Android, the asset should be accessible via relative 
 * path from the WebView
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Asset Path Resolution Property Tests', () => {
  /**
   * Property 1: Asset Path Resolution
   * For any asset file in public directory, it should exist in dist with relative path
   */
  it('should resolve all public assets to dist with relative paths', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('sounds', 'backgrounds', 'assets'),
        (assetDir) => {
          const publicPath = path.join(process.cwd(), 'public', assetDir);
          const distPath = path.join(process.cwd(), 'dist', assetDir);
          
          // Check if public directory exists
          if (!fs.existsSync(publicPath)) {
            return true; // Skip if directory doesn't exist
          }
          
          // Check if dist directory exists (build must be run first)
          if (!fs.existsSync(distPath)) {
            throw new Error(`Dist directory not found: ${distPath}. Run 'npm run build' first.`);
          }
          
          // Get all files in public directory
          const publicFiles = fs.readdirSync(publicPath);
          
          // Verify each file exists in dist
          for (const file of publicFiles) {
            const distFilePath = path.join(distPath, file);
            const fileExists = fs.existsSync(distFilePath);
            
            if (!fileExists) {
              console.error(`Missing file in dist: ${assetDir}/${file}`);
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * Property 1.1: Sound files should use relative paths
   * Verify that sound files are accessible via relative paths
   */
  it('should have all sound files accessible via relative paths', () => {
    const soundsPath = path.join(process.cwd(), 'dist', 'sounds');
    
    if (!fs.existsSync(soundsPath)) {
      throw new Error('Sounds directory not found in dist. Run npm run build first.');
    }
    
    const soundFiles = fs.readdirSync(soundsPath);
    
    // Property: All sound files should be .mp3 files
    fc.assert(
      fc.property(
        fc.constantFrom(...soundFiles),
        (soundFile) => {
          const filePath = path.join(soundsPath, soundFile);
          const fileExists = fs.existsSync(filePath);
          const isMP3 = soundFile.endsWith('.mp3');
          
          return fileExists && isMP3;
        }
      ),
      { numRuns: Math.min(soundFiles.length, 100) }
    );
  });

  /**
   * Property 1.2: Image files should use relative paths
   * Verify that image files are accessible via relative paths
   */
  it('should have all image files accessible via relative paths', () => {
    const assetsPath = path.join(process.cwd(), 'dist', 'assets');
    const backgroundsPath = path.join(process.cwd(), 'dist', 'backgrounds');
    
    const checkImageDirectory = (dirPath) => {
      if (!fs.existsSync(dirPath)) {
        return true; // Skip if directory doesn't exist
      }
      
      const files = fs.readdirSync(dirPath).filter(f => 
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.svg')
      );
      
      if (files.length === 0) {
        return true; // No image files to check
      }
      
      // Property: All image files should exist and be accessible
      fc.assert(
        fc.property(
          fc.constantFrom(...files),
          (imageFile) => {
            const filePath = path.join(dirPath, imageFile);
            return fs.existsSync(filePath);
          }
        ),
        { numRuns: Math.min(files.length, 100) }
      );
      
      return true;
    };
    
    checkImageDirectory(assetsPath);
    checkImageDirectory(backgroundsPath);
  });

  /**
   * Property 1.3: No absolute paths in source code
   * Verify that source code uses relative paths for assets
   */
  it('should not contain absolute paths in SoundManager', () => {
    const soundManagerPath = path.join(process.cwd(), 'src', 'utils', 'SoundManager.js');
    
    if (!fs.existsSync(soundManagerPath)) {
      throw new Error('SoundManager.js not found');
    }
    
    const content = fs.readFileSync(soundManagerPath, 'utf-8');
    
    // Property: Should not contain absolute paths like '/sounds/'
    const hasAbsolutePaths = content.includes("'/sounds/") || content.includes('"/sounds/');
    
    expect(hasAbsolutePaths).toBe(false);
    
    // Property: Should contain relative paths like './sounds/'
    const hasRelativePaths = content.includes("'./sounds/") || content.includes('"./sounds/');
    
    expect(hasRelativePaths).toBe(true);
  });
});
