import { Button } from './button';
export function Empty({ title, desc, action }: { title:string, desc?:string, action?:()=>void }){
  return (
    <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-3">
      <p className="text-lg font-bold">{title}</p>
      {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      {action && <Button onClick={action}>Take action</Button>}
    </div>
  );
}
export function ErrorBox({ message }: { message:string }){
  return <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg">{message}</div>;
}
export function Skeleton(){ return <div className="animate-pulse bg-muted h-24 rounded-lg" />; }
