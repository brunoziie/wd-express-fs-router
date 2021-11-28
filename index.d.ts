/// <reference types="express" />
import { Express } from 'express';
declare function router(basedir: string, expressAppInstance: Express): void;
export = router;
export as namespace router;