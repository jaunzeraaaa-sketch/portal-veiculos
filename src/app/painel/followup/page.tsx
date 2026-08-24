import { redirect } from 'next/navigation'

/**  FOLLOW-UP — desativado da interface, mas nada foi apagado.
 *
 *   O componente com a cadência e a calculadora de custo continua inteiro em
 *   src/components/Cadencia.tsx, e o item do menu está em SidebarNav.tsx.
 *
 *   Para trazer de volta:
 *     1. apague este arquivo e restaure a página abaixo;
 *     2. devolva a linha do Follow-up em src/components/SidebarNav.tsx
 *        (ITENS) junto com o ícone 'followup'.
 *
 *   Página original:
 *
 *   import Cadencia from '@/components/Cadencia'
 *   export const dynamic = 'force-dynamic'
 *   export default function FollowUp() {
 *     return (
 *       <>
 *         <div className="page-head">
 *           <p>O lead que não fechou hoje não está perdido — está sem próximo
 *              contato. Esta é a sequência que você deve seguir, e o que ela custa.</p>
 *         </div>
 *         <Cadencia />
 *       </>
 *     )
 *   }
 */
export default function FollowUpDesativado() {
  redirect('/painel')
}
