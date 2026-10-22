# Rua 90 — Protocolo de colaboração Arena + ChatGPT

## Fonte oficial

- Repositório: https://github.com/GrupoXuy/Rua-90-o-jogo
- Branch principal: `main`
- Arquivo principal do jogo: `index.html`
- Identidade: **RUA 90. NA PISTA.** / **R/90** / **RUA NOVENTA**

O GitHub é a fonte comum de verdade. Não considere uma cópia local, um ZIP ou uma prévia do Arena como a versão oficial sem comparar seu conteúdo com o repositório.

## Estado de referência inspecionado em 2026-10-22

- `main:index.html` foi lido diretamente do GitHub.
- Blob SHA do arquivo principal: `9c28fb8a2f3b5edc94e60b84c6315c706bdcef58`.
- Tamanho retornado pelo GitHub: 559.893 caracteres.
- O HTML define o título `Rua 90 | Corrida de Rua Brasileira`, monta a aplicação em `#root` e inclui a garagem.
- Estruturas/compatibilidade a preservar: `rua95-records-v2`, `rua95-name`, `rua95-mode`, `rua95-duel-v1`, `mdNew` e `window.__mdWS`.

## Aviso sobre o ZIP recebido

O arquivo `ruanoventa(1).zip`, inspecionado em 2026-10-22, contém apenas `index.html`, com 337.827 bytes. Seu Git blob SHA-1 calculado é `fc528e19d0d62dfd0ed2f0d1e6a9f1304170f82b`, diferente do blob atual de `main`.

**Não sobrescreva `main:index.html` com esse ZIP automaticamente.** Trate-o como uma cópia de referência separada até que as diferenças sejam comparadas e aprovadas. A diferença pode representar uma versão anterior ou uma variante; a inspeção não prova qual delas tem os recursos mais recentes.

## Divisão do trabalho

### Arena
1. Leia este documento e verifique o estado atual de `main` antes de começar.
2. Implemente alterações no código quando o projeto estiver acessível.
3. Faça alterações pequenas e focadas; evite reformulações amplas não solicitadas.
4. Execute testes adequados e registre os resultados reais.
5. Compartilhe os arquivos alterados, resumo, commit SHA e pendências.
6. Se não puder acessar GitHub, executar testes ou publicar, diga isso explicitamente.

### ChatGPT
1. Revisará o código, as decisões, os commits e os resultados que estiverem acessíveis.
2. Ajudará a definir prioridades, identificar regressões e orientar testes.
3. Não presumirá que alterações do Arena foram sincronizadas até verificar o repositório ou receber os arquivos/diffs.
4. Não afirmará que um teste ou deploy foi concluído sem evidência.

### Evitar conflitos
- Antes de editar, confira os commits recentes e se o arquivo mudou desde a última leitura.
- Não permita que os dois agentes editem simultaneamente o mesmo arquivo sem comparar os diffs.
- Prefira branches de tarefa ou commits pequenos e descritivos.
- Nunca force-push, apague trabalho alheio ou substitua arquivos apenas por terem o mesmo nome.
- Se houver divergência entre ZIP, preview do Arena e GitHub, pare a substituição automática e compare os conteúdos.

## Critérios para relatar o estado

Sempre diferencie:
- **Implementado:** código alterado.
- **Testado:** teste executado, com resultado descrito.
- **Commitado:** alteração registrada no GitHub, com SHA.
- **Publicado:** deploy confirmado por URL acessível.
- **Pendente:** qualquer etapa não verificada.

Um commit não prova que a aplicação foi publicada; uma tentativa de publicação não prova que o site está funcionando.

## Relatório obrigatório ao fim de cada etapa

- **Tarefa e objetivo**
- **Estado anterior**
- **Arquivos alterados**
- **Mudanças realizadas**
- **Testes executados e resultados**
- **Branch e commit SHA**
- **Estado da publicação e evidência**
- **Pendências / riscos**
- **Próxima ação recomendada**
- **Contexto necessário para o outro agente continuar**

## Prioridades do produto

- Carros com proporções, curvas, sombras, reflexos e detalhes melhores.
- Rodas corretamente alinhadas, sem clipping para fora da carroceria durante a corrida.
- Câmera baixa, próxima ao asfalto, com sensação de velocidade.
- Tráfego, espaçamento e colisões consistentes.
- Menu inicial separado da garagem.
- Veículo selecionado na garagem parado, de frente e ligeiramente inclinado para a direita, com rodas visíveis.
- Interface responsiva, desempenho estável e ausência de erros críticos.
- Preservar os dados locais e estruturas listadas acima, a menos que uma migração compatível seja planejada e testada.

## Primeira ação ao iniciar uma sessão

1. Leia este documento e consulte o último commit de `main`.
2. Inspecione o estado real do jogo e as pendências.
3. Escolha a melhoria segura de maior prioridade.
4. Implemente, teste e registre evidências.
5. Entregue o relatório para que o outro agente continue do mesmo estado.
