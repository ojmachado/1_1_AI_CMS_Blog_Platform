
'use client';
import React, { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Edit2, Split, Trash2 } from 'lucide-react';

const ConditionNode = ({ id, data, isConnectable }: NodeProps) => {
  const { setNodes } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja remover esta bifurcação lógica? Todas as conexões dos caminhos Sim/Não serão removidas.")) {
      setNodes((nodes) => nodes.filter((node) => node.id !== id));
    }
  };

  return (
    <div className="relative group">
      <div className="w-[150px] h-[75px] bg-white border border-slate-200 border-l-[6px] border-l-purple-500 rounded-xl shadow-lg flex items-center px-4 overflow-hidden transition-all hover:shadow-xl hover:border-purple-200">
        <div className="mr-2 p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
          <Split size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider leading-tight select-none">
                Bifurcação
            </span>
            <span className="text-[9px] font-bold text-slate-400 leading-tight select-none italic truncate mt-1">
                {data.label || 'Definir Regra'}
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
        className="hidden group-hover:flex absolute -top-3 bg-purple-500 text-white p-2 rounded-full shadow-lg hover:bg-purple-600 transition-colors z-20 animate-in zoom-in shadow-purple-100"
        style={{ left: '138px' }}
        title="Configurar Regra"
      >
        <Edit2 size={12} />
      </button>

      {/* Saída TRUE (Superior) */}
      <div className="absolute -right-2 top-2 flex items-center gap-1.5">
          <span className="text-[8px] font-black text-green-600 uppercase">Sim</span>
          <Handle 
            id="true"
            type="source" 
            position={Position.Right} 
            isConnectable={isConnectable} 
            className="!bg-green-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-sm !static" 
          />
      </div>

      {/* Saída FALSE (Inferior) */}
      <div className="absolute -right-2 bottom-2 flex items-center gap-1.5">
          <span className="text-[8px] font-black text-red-600 uppercase">Não</span>
          <Handle 
            id="false"
            type="source" 
            position={Position.Right} 
            isConnectable={isConnectable} 
            className="!bg-red-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-sm !static" 
          />
      </div>
    </div>
  );
};

export default memo(ConditionNode);
