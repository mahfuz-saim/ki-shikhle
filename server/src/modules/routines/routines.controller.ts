import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './routines.service';
export const list = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.listRoutines(req.params.id, (req.user as any).userId); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const create = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.createRoutine(req.params.id, (req.user as any).userId, req.body); res.status(201).json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const update = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.updateRoutine(req.params.id, (req.user as any).userId, req.body); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const remove = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.deleteRoutine(req.params.id, (req.user as any).userId); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const addException = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.addException(req.params.id, (req.user as any).userId, req.body); res.status(201).json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const deleteException = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.deleteException(req.params.id, (req.user as any).userId); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const schedule = async (req:Request,res:Response,next:NextFunction)=>{ try{ const {from,to}=req.query as any; const d=await svc.getSchedule(req.params.id, (req.user as any).userId, from, to); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
