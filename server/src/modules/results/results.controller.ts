import { Request, Response, NextFunction } from 'express';
import * as svc from './results.service';
export const getResults = async (req:Request,res:Response,next:NextFunction)=>{ try{ const data=await svc.getAttemptResults(req.params.id, (req.user as any).userId); res.json({success:true,data,error:null}); }catch(e){next(e);} };
export const createExplanation = async (req:Request,res:Response,next:NextFunction)=>{ try{ const data=await svc.generateExplanation(req.params.id, (req.user as any).userId, req.body.language||req.query.language as string||'en'); res.status(201).json({success:true,data,error:null}); }catch(e){next(e);} };
