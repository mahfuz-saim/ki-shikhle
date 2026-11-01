import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './admin.service';
export const metrics=async(req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.metrics(); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const aiUsage=async(req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.aiUsage(req.query as any); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const users=async(req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.listUsers(); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const extendTrial=async(req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.extendTrial(req.params.id, req.body.days||7); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
