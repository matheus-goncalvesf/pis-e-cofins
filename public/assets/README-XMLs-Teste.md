# XMLs de Teste para Validação de Créditos PIS/COFINS Monofásicos

Esta pasta contém 3 XMLs de teste para validar o sistema de identificação de créditos PIS/COFINS monofásicos no Simples Nacional.

## Arquivos

### 1. `nfe-teste-credito-permitido-1.xml`
**✅ CRÉDITO PERMITIDO - Venda Estadual**

- **Emitente**: Distribuidora de Bebidas Exemplo LTDA (SP)
- **Destinatário**: Supermercado Cliente LTDA (SP)
- **CFOP**: 5102 (Venda dentro do estado)
- **Produtos**:
  - Água Mineral natural 500ml (NCM 22011000) - **MONOFÁSICO** ✅
  - Refrigerante Cola 2L (NCM 22021000) - **MONOFÁSICO** ✅
- **Valor Total**: R$ 475,00
- **Resultado Esperado**: Ambos produtos devem ser marcados como monofásicos com crédito permitido

---

### 2. `nfe-teste-credito-permitido-2.xml`
**✅ CRÉDITO PERMITIDO - Venda Interestadual**

- **Emitente**: Distribuidora de Bebidas Exemplo LTDA (SP)
- **Destinatário**: Loja de Conveniência XYZ LTDA (RJ)
- **CFOP**: 6102 (Venda para outro estado)
- **Produtos**:
  - Cerveja Lager Lata 350ml (NCM 22030000) - **MONOFÁSICO** ✅
- **Valor Total**: R$ 780,00
- **Resultado Esperado**: Produto deve ser marcado como monofásico com crédito permitido

---

### 3. `nfe-teste-credito-bloqueado.xml`
**❌ CRÉDITO BLOQUEADO - Compra (Entrada)**

- **Emitente**: Atacadista Fornecedor LTDA
- **Destinatário**: Supermercado Cliente LTDA
- **CFOP**: 1102 (Compra para comercialização)
- **Produtos**:
  - Refrigerante Guaraná 500ml (NCM 22021000) - **MONOFÁSICO** mas entrada
  - Água Mineral Sem Gás 1L (NCM 22011000) - **MONOFÁSICO** mas entrada
- **Valor Total**: R$ 820,00
- **Resultado Esperado**: 
  - Produtos identificados como monofásicos pelo NCM
  - **MAS** crédito bloqueado devido ao CFOP de ENTRADA (1102)
  - ⚠️ Card deve exibir warning: "CFOP Requer Atenção"
  - ⚠️ Mensagem: "CFOP 1102 é operação de ENTRADA/COMPRA. No Simples Nacional, crédito vem de VENDAS"

## NCMs Monofásicos Utilizados

| NCM | Descrição | Status |
|-----|-----------|--------|
| 22011000 | Águas minerais e gaseificadas | ✅ Monofásico |
| 22021000 | Refrigerantes | ✅ Monofásico |
| 22030000 | Cervejas | ✅ Monofásico |

## CFOPs Utilizados

| CFOP | Descrição | Contexto | Permite Crédito? |
|------|-----------|----------|------------------|
| 5102 | Venda dentro do estado | Simples Nacional - VENDA | ✅ SIM |
| 6102 | Venda para outro estado | Simples Nacional - VENDA | ✅ SIM |
| 1102 | Compra para comercialização | ENTRADA/COMPRA | ❌ NÃO (no SN) |

## Como Testar

1. Acesse a aplicação: http://localhost:5173/
2. Faça login/crie uma empresa
3. Vá para "Importar XMLs"
4. Upload de cada XML
5. Vá para "Revisão Fiscal"
6. Verifique:
   - XMLs 1 e 2: produtos marcados como monofásicos, sem alertas
   - XML 3: produtos com warning visual, CFOP vermelho, crédito bloqueado

## Validações Esperadas

### XML 1 e 2 (Créditos Permitidos):
- ✅ Produtos com checkbox "Monofásico" marcado
- ✅ CFOP exibido em verde
- ✅ Sem warnings no card
- ✅ Receita incluída no cálculo de crédito

### XML 3 (Crédito Bloqueado):
- ⚠️ Badge amarelo no card: "CFOP Requer Atenção"
- ❌ CFOP exibido em vermelho
- ❌ Checkbox "Monofásico" NÃO marcado
- ⚠️ Alerta inline: "CFOP 1102 é uma operação de ENTRADA..."
- ⚠️ Banner expandido explicando o bloqueio
- ❌ Receita NÃO incluída no cálculo

---

**Nota**: Estes XMLs são simplificados para teste. XMLs reais da SEFAZ podem ter estrutura mais complexa com assinaturas digitais, mas o parser está preparado para ambos os casos.
