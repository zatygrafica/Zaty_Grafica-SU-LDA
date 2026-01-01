/**
 * Resolve asset paths for both web and Electron environments
 * In Electron, assets must be loaded from the correct file:// path
 */

const isElectron = () => {
  return window.electronAPI?.isElectron || false;
};

/**
 * Get the correct path for an asset based on the environment
 * @param assetPath - Relative path to the asset (e.g., '/logo.png', '/icon-512x512.png')
 * @returns The correct absolute path for the current environment
 */
export const getAssetPath = (assetPath: string): string => {
  // Remove leading slash if present
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  if (isElectron()) {
    // In Electron, use the base href which is already set to './'
    // This makes '/logo.png' resolve to './logo.png' relative to index.html
    return `./${cleanPath}`;
  }

  // In web browser, use absolute path from root
  return `/${cleanPath}`;
};

/**
 * Common asset paths used throughout the application
 */
export const ASSETS = {
  LOGO: getAssetPath('/logo.png'),
  ICON_512: getAssetPath('/icon-512x512.png'),
} as const;
