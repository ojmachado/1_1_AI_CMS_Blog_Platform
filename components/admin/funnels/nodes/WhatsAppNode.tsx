
'use client';
import React, { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { MessageCircle, Edit2, Clock, Trash2 } from 'lucide-react';

const WhatsAppNode = ({ id, data, isConnectable }: NodeProps) => {
  const { setNodes } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja remover este nó de WhatsApp? Todas as conexões ligadas a ele serão excluídas.")) {
      setNodes((nodes) => nodes.filter((node) => node.id !== id));
    }
  };

  return (
    <div className="relative group">
      <div className="w-[140px] h-[55px] bg-white border border-slate-200 border-l-[6px] border-l-green-500 rounded-xl shadow-lg flex items-center px-3 overflow-hidden transition-all hover:shadow-xl hover:border-green-200">
        <div className="mr-2 p-1.5 bg-green-50 text-green-600 rounded-lg shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
          <MessageCircle size={16} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-green-600 uppercase tracking-wider leading-tight select-none">
                    WhatsApp
                </span>
                {data.sendTime && (
                    <div className="flex items-center text-[7px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-100 font-bold">
                        <Clock size={7} className="mr-0.5" /> {data.sendTime}
                    </div>
                )}
            </div>
            <span className="text-[10px] font-bold text-slate-700 truncate leading-tight select-none mt-0.5">
                {data.label || 'Selecionar...'}
            </span>
        </div>
      </div>

      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white shadow-sm" />
      
      {/* Botão de Excluir */}
      <button 
        onClick={onDelete}
        className="hidden group-hover:flex absolute -top-2.5 -left-2.5 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-20 animate-in zoom-in shadow-red-100"
        title="Remover Nó"
      >
        <Trash2 size={10} />
      </button>

      {/* Botão de Edição */}
      <button 
        onClick={(e) => {
            e.stopPropagation();
            data.onEdit();
        }}
        className="hidden group-hover:flex absolute -top-2.5 -right-2.5 bg-green-500 text-white p-1.5 rounded-full shadow-lg hover:bg-green-600 transition-colors z-20 animate-in zoom-in shadow-green-100"
        title="Configurar Mensagem"
      >
        <Edit2 size={10} />
      </button>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white shadow-sm" />
    </div>
  );
};

export default memo(WhatsAppNode);
