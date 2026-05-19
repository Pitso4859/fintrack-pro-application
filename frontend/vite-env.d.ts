/**
 * vite-env.d.ts
 * 
 * This file provides TypeScript type definitions for Vite's environment variables.
 * Vite automatically exposes environment variables that start with VITE_ (e.g., VITE_API_BASE_URL)
 * through the `import.meta.env` object. However, TypeScript doesn't know about them by default,
 * so we need to declare the shape of `import.meta.env` to get type safety and autocompletion.
 * 
 * The triple-slash directive `/// <reference types="vite/client" />` imports the default Vite types,
 * which include basic definitions for `import.meta.env` (like MODE, BASE_URL, etc.).
 * We then extend those definitions with our own custom environment variables.
 * 
 * @see https://vitejs.dev/guide/env-and-mode.html#env-files
 */

/// <reference types="vite/client" />

/**
 * Describes the shape of our custom environment variables.
 * All variables must be prefixed with VITE_ to be exposed by Vite.
 * 
 * @property {string} VITE_API_BASE_URL - The base URL for the backend API.
 *  
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // If you add more VITE_ variables in the future, list them here:
  // readonly VITE_ANOTHER_KEY: string;
}

/**
 * Extends the ImportMeta interface to include our custom env typing.
 * This tells TypeScript that `import.meta.env` has the shape defined in ImportMetaEnv.
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}