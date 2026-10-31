import { Request, Response, NextFunction } from 'express';
import * as svc from './billing.service';
export const plans = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.getPlans(); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const subscription = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.getSubscription((req.user as any).userId); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const checkout = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.demoCheckout((req.user as any).userId, req.body); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const cancel = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.cancelSubscription((req.user as any).userId); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
export const invoices = async (req:Request,res:Response,next:NextFunction)=>{ try{ const d=await svc.getInvoices((req.user as any).userId); res.json({success:true,data:d,error:null}); }catch(e){next(e);} };
