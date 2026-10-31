import { Request, Response, NextFunction } from 'express';
import * as svc from './notifications.service';
export const list=async(req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.list((req.user as any).userId); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const read=async(req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.markRead((req.user as any).userId, req.params.id); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const readAll=async(req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.markAllRead((req.user as any).userId); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
