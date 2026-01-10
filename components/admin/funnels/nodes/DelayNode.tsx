
'use client';
import React, { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Edit2, Clock, Trash2 } from 'lucide-react';

const DelayNode = ({ id, data, isConnectable }: NodeProps) => {
  const { setNodes } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja remover este atraso? Todas as conexões serão perdidas.")) {
      setNodes((nodes) => nodes.filter((node) => node.id !== id));
    }
  };

  return (
    <div className="relative group">
      <div className="w-[140px] h-[60px] bg-white border border-slate-200 border-l-[6px] border-l-amber-500 rounded-xl shadow-lg flex items-center px-4 overflow-hidden transition-all hover:shadow-xl hover:border-amber-200">
        <div className="mr-3 p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
          <Clock size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider leading-tight select-none">
                Aguardar
            </span>
            <span className="text-sm font-black text-slate-800 font-mono leading-tight select-none mt-0.5">
                {data.hours ? `${data.hours}h` : '24h'}
            </span>
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white shadow-sm" 
      />
      
      {/* Botão de Excluir */}
      <button 
        onClick={onDelete}
        className="hidden group-hover:flex absolute -top-3 -left-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-20 animate-in zoom-in shadow-red-100"
        title="Remover Nó"
      >
        <Trash2 size={12} />
      </button>

      {/* Botão de Edição */}
      <button 
        onClick={(e) => {
            e.stopPropagation();
            data.onEdit?.();
        }}
        className="hidden group-hover:flex absolute -top-3 -right-3 bg-amber-500 text-white p-2 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-20 animate-in zoom-in shadow-amber-100"
        title="Configurar Atraso"
      >
        <Edit2 size={12} />
      </button>

      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable} 
        className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white shadow-sm" 
      />
    </div>
  );
};

export default memo(DelayNode);
