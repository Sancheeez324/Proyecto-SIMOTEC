import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    chromeWebSecurity: false, // Desactivar chromeWebSecurity
  },
  video: true, // Activar grabación de video
});
