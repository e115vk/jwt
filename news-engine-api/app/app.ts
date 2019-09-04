import { NewsEngineAPI } from './service';

const newAPI = new NewsEngineAPI();

newAPI.start().catch(console.error);
