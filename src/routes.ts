import { Router, json } from 'express';
import ClassControllers from './controllers/ClassController';
import ConnectionsController from './controllers/ConnectionsController';

const routes = Router();

routes.use(json());

routes.post('/classes', ClassControllers.store);
routes.get('/classes', ClassControllers.index);

routes.post('/connection', ConnectionsController.store);
routes.get('/connection', ConnectionsController.index);

export default routes;