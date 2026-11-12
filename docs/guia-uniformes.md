# Guia: a tua parte nos uniformes

Este documento explica **só o que tu tens de fazer**. O resto (aplicar a cor do
clube, escolher casa/fora, guarda-redes) é código e eu trato.

## A ideia em uma frase

Pintas a roupa nas 106 poses que **já existem**, usando **4 cores combinadas**
(cores-chave). O jogo troca essas 4 cores pela paleta do clube. Resultado: as 74
equipas ficam com uniforme próprio sem desenhares 74 jogos de sprites.

Ver `template-uniformes.png` (onde pintar) e `fluxo-uniformes.png` (o resultado).

## As 4 cores-chave

Usa **exatamente** estes valores. Não os alteres, nem os apliques com
transparência — têm de ser opacos.

| Peça | Cor-chave | Onde pintar |
|---|---|---|
| Gola e mangas | `#ffff00` amarelo | à volta do pescoço e nas pontas das mangas |
| Camisola | `#ff00ff` magenta | tronco e restante manga |
| Calções | `#00ffff` ciano | da cintura até meio da coxa |
| Meias | `#00ff00` verde | da canela até ao pé |

O que **não** pintas, fica como está:

- **Cara, cabelo, pescoço, braços e pernas de pele** → mantêm-se. Cada jogador
  continua a ter o seu tom de pele e o seu cabelo.
- **Contorno preto** → mantém-se. É ele que dá o desenho.

## Passo a passo

1. Abre um dos spritesheets atuais, por exemplo
   `public/assets/animations/corrida_frente.png`.
2. Vê a grelha: 4 colunas × 2 linhas = 8 frames (na caminhada frente são 5×2).
3. Em **cada frame**, pinta a roupa com as 4 cores-chave, seguindo a tabela acima.
4. Guarda o ficheiro. Mantém as mesmas dimensões e a mesma grelha.
5. Repete para as 13 sheets.

## Regras para os ficheiros entrarem sem eu mexer em mais nada

| Regra | Porquê |
|---|---|
| Mesma grelha (4×2; caminhada frente 5×2) | o código divide a imagem pela grelha |
| Mesmas dimensões do ficheiro | a ancoragem dos pés depende disso |
| Fundo igual ao atual (cinza uniforme escuro) | o jogo recorta-o por flood-fill |
| Pés na base do frame | é o ponto onde o jogador toca no chão |
| Cores-chave **opacas** e exatas | a troca de cor é por igualdade |
| Contorno e pele intactos | não são recoloridos |

## O que acontece a seguir (minha parte)

1. Escrevo a recoloração: lê a paleta do clube (`primary`, `secondary`,
   `shorts`, `socks`, `trim`) e troca as 4 cores-chave.
2. Ligo ao `kitForClub()`, que já existe e já escolhe casa/fora/terceiro e a cor
   do guarda-redes.
3. Escrevo um validador que verifica os teus ficheiros antes de entrarem
   (grelha, fundo, cores-chave presentes, pés ancorados) e diz o que está errado.

## Porque não um sprite por equipa

Um kit são 106 frames. Para 74 equipas, casa+fora+guarda-redes, são 23 532
frames (~392 h de trabalho). E como cada jogador tem tom de pele e cabelo
próprios, a pele "cozida" na arte deixaria os 11 jogadores da equipa todos
iguais.

Com as cores-chave: **106 frames** e o resultado serve as 74 equipas, os 8 tons
de pele, e aguenta transferências.
