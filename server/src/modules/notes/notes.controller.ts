import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './notes.service';
export const create = async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const childId = (req.params as any).id || (req.body.childId);
    const data = await svc.createNote(childId, (req.user as any).userId, (req as any).file, req.body);
    res.status(201).json({success:true,data,error:null});
  } catch(e){next(e);}
};
export const list = async (req:Request,res:Response,next:NextFunction)=>{
  try { const data=await svc.listNotes((req.params as any).id || (req.params as any).childId || req.query.childId as string, (req.user as any).userId); res.json({success:true,data,error:null}); }catch(e){next(e);}
};
export const update = async (req:Request,res:Response,next:NextFunction)=>{
  try { const data=await svc.updateNote(req.params.id, (req.user as any).userId, req.body); res.json({success:true,data,error:null}); }catch(e){next(e);}
};
export const remove = async (req:Request,res:Response,next:NextFunction)=>{
  try { const data=await svc.deleteNote(req.params.id, (req.user as any).userId); res.json({success:true,data,error:null}); }catch(e){next(e);}
};
export const aiOcr = async (req:Request,res:Response,next:NextFunction)=>{
  try { const data=await svc.aiOcrFallback(req.params.id, (req.user as any).userId, (req.user as any).userId); res.json({success:true,data,error:null}); }catch(e){next(e);}
};
