import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { clsx } from 'clsx';
export function Button({asChild=false,variant='primary',className,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{asChild?:boolean;variant?:'primary'|'secondary'|'ghost'|'danger'}){const Comp=asChild?Slot:'button';return <Comp className={clsx('button',`button-${variant}`,className)} {...props}/>;}
