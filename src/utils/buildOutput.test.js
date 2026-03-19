/**
 * Property-Based Tests for Build Output Completeness
 * Feature: android-apk-conversion, Property 2: Build Output Completeness
 * Validates: Requirements 2.5
 * 
 * Property: For any file in the public directory, after running the build command,
 * that file should exist in the dist output directory
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

describe('Build Output Completeness Property Tests', () => {
  /**
   * Property 2: Build Output Completeness
   * For any file in public directory, it should exist in dist after build
   */
  it('should copy all files from public to dist during build', () => {
    const publicPath = path.join(process.cwd(), 'public');
    const distPath = path.join(process.cwd(), 'dist');
    
    // Check if dist exists (build must be run first)
    if (!fs.existsSync(distPath)) {
      throw new Error('Dist directory not found. Run npm run build first.');
    }
    
    // Get all subdirectories in public
    const publicDirs = fs.readdirSync(publicPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // Property: For each directory in public, all files should exist in dist
    fc.assert(
      fc.property(
        fc.constantFrom(...publicDirs),
        (dirName) => {
          const publicDirPath = path.join(publicPath, dirName);
          const distDirPath = path.join(distPath, dirName);
          
          // Get all files in public subdirectory
          const publicFiles = fs.readdirSync(publicDirPath);
          
          // Check if dist subdirectory exists
          if (!fs.existsSync(distDirPath)) {
            console.error(`Missing directory in dist: ${dirName}`);
            return false;
          }
          
          // Verify each file exists in dist
          for (const file of publicFiles) {
            const distFilePath = path.join(distDirPath, file);
            if (!fs.existsSync(distFilePath)) {
              console.error(`Missing file in dist: ${dirName}/${file}`);
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.1: All sound files should be copied to dist
   */
  it('should copy all sound files from public/sounds to dist/sounds', () => {
    const publicSoundsPath = path.join(process.cwd(), 'public', 'sounds');
    const distSoundsPath = path.join(process.cwd(), 'dist', 'sounds');
    
    if (!fs.existsSync(publicSoundsPath)) {
      throw new Error('Public sounds directory not found');
    }
    
    if (!fs.existsSync(distSoundsPath)) {
      throw new Error('Dist sounds directory not found. Run npm run build first.');
    }
    
    const publicSounds = fs.readdirSync(publicSoundsPath);
    const distSounds = fs.readdirSync(distSoundsPath);
    
    // Property: Every sound file in public should exist in dist
    fc.assert(
      fc.property(
        fc.constantFrom(...publicSounds),
        (soundFile) => {
          return distSounds.includes(soundFile);
        }
      ),
      { numRuns: Math.min(publicSounds.length, 100) }
    );
    
    // Additional check: Count should match
    expect(publicSounds.length).toBe(distSounds.length);
  });

  /**
   * Property 2.2: All image files should be copied to dist
   */
  it('should copy all image files from public to dist', () => {
    const checkImageCopy = (subDir) => {
      const publicPath = path.join(process.cwd(), 'public', subDir);
      const distPath = path.join(process.cwd(), 'dist', subDir);
      
      if (!fs.existsSync(publicPath)) {
        return true; // Skip if directory doesn't exist
      }
      
      if (!fs.existsSync(distPath)) {
        throw new Error(`Dist ${subDir} directory not found. Run npm run build first.`);
      }
      
      const publicFiles = fs.readdirSync(publicPath);
      const distFiles = fs.readdirSync(distPath);
      
      // Property: Every file in public should exist in dist
      fc.assert(
        fc.property(
          fc.constantFrom(...publicFiles),
          (file) => {
            return distFiles.includes(file);
          }
        ),
        { numRuns: Math.min(publicFiles.length, 100) }
      );
      
      return true;
    };
    
    checkImageCopy('assets');
    checkImageCopy('backgrounds');
  });

  /**
   * Property 2.3: File sizes should match between public and dist
   * Files should be copied without corruption
   */
  it('should preserve file sizes when copying from public to dist', () => {
    const publicPath = path.join(process.cwd(), 'public');
    const distPath = path.join(process.cwd(), 'dist');
    
    const publicDirs = ['sounds', 'assets', 'backgrounds'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...publicDirs),
        (dirName) => {
          const publicDirPath = path.join(publicPath, dirName);
          const distDirPath = path.join(distPath, dirName);
          
          if (!fs.existsSync(publicDirPath) || !fs.existsSync(distDirPath)) {
            return true; // Skip if directory doesn't exist
          }
          
          const publicFiles = fs.readdirSync(publicDirPath);
          
          // Check file sizes match
          for (const file of publicFiles) {
            const publicFilePath = path.join(publicDirPath, file);
            const distFilePath = path.join(distDirPath, file);
            
            if (!fs.existsSync(distFilePath)) {
              return false;
            }
            
            const publicStats = fs.statSync(publicFilePath);
            const distStats = fs.statSync(distFilePath);
            
            // File sizes should match (files are copied, not transformed)
            if (publicStats.size !== distStats.size) {
              console.error(`File size mismatch: ${dirName}/${file}`);
              console.error(`Public: ${publicStats.size}, Dist: ${distStats.size}`);
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.4: Dist should contain index.html
   */
  it('should generate index.html in dist', () => {
    const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
    
    expect(fs.existsSync(distIndexPath)).toBe(true);
    
    // Verify index.html contains relative paths
    const indexContent = fs.readFileSync(distIndexPath, 'utf-8');
    
    // Should contain relative script and css paths
    expect(indexContent).toContain('./assets/');
  });

  /**
   * Property 2.5: Dist should contain bundled JS and CSS
   */
  it('should generate bundled assets in dist/assets', () => {
    const distAssetsPath = path.join(process.cwd(), 'dist', 'assets');
    
    expect(fs.existsSync(distAssetsPath)).toBe(true);
    
    const assetFiles = fs.readdirSync(distAssetsPath);
    
    // Should contain at least one JS file
    const hasJSFile = assetFiles.some(file => file.endsWith('.js'));
    expect(hasJSFile).toBe(true);
    
    // Should contain at least one CSS file
    const hasCSSFile = assetFiles.some(file => file.endsWith('.css'));
    expect(hasCSSFile).toBe(true);
  });
});
