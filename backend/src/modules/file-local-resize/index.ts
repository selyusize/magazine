import { ModuleProvider, Modules } from "@medusajs/framework/utils";

import { LocalResizeFileService } from "./service/local-resize-file";

/** Файловый провайдер: file-local + уменьшенные копии изображений. Подключается в medusa-config.ts. */
export default ModuleProvider(Modules.FILE, {
  services: [LocalResizeFileService],
});
