# ⚡ RuneBound: The Ascendant (2D)

Jogo de ação 2D em **Canvas HTML** (sem dependências externas), com combate de espada/estoque,
investida e **5 andares** na torre ancestral.

## Como jogar
Abra `index.html` no navegador (desktop). **Não requer internet** — tudo roda local.
Na tela inicial, escolha entre os dois personagens:

| Personagem | Vida | Velocidade | Golpe | Arma |
|---|---|---|---|---|
| ⚔ **Cavaleiro Solitário** | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | Espada larga (área grande, dano alto) |
| 🛡 **Guarda Real** | ★★★★☆ | ★★★★☆ | ★★★☆☆ | Estoque rápido + escudo |

## Controles
| Tecla | Ação |
|---|---|
| `W A S D` **ou** `← ↑ ↓ →` | Mover |
| `Mouse` / `Espaço` | Atacar (o golpe aponta para o cursor quando há mouse em uso) |
| `Shift` | Investida — breve invulnerabilidade + fantasmas do motion trail |

## Os 5 Andares
1. **Os Pátios da Torre** — noite, lua e chuva sobre o vilarejo em ruínas. Derrote **10 lacaios**.
2. **As Catacumbas Esquecidas** — labirinto escuro iluminado por tochas (escuridão dinâmica).
   Encontre **3 chaves 🔑**; evite **espinhos oscilantes** e o **bando de morcegos**.
3. **A Grande Biblioteca** — estantes de livros; elimine os **4 Magos Renegados** e seus
   feitiços **teleguiados**. Feitiço que erra e atinge uma estante **incendeia** o chão.
4. **Os Jardins Suspensos** — pontes sobre o **abismo**; rajadas de **vento** empurram
   (com linhas de vento visíveis) e **plantas venenosas** causam dano. Alcance o **portal**.
5. **O Altar do Eclipse** — o **Necromante** é invulnerável até que as **4 Runas** sejam
   destruídas; alterna invocar lacaios ↔ leques de esferas teleguiadas. Silva-o antes do
   **ritual de 180 s** acabar (barra de vida do chefe no rodapé).

## Arquitetura (`src/main.js`)
- Loop `requestAnimationFrame` com delta-time; câmera 2D suave com shake.
- Sprites vetoriais animados desenhados por código (herói com capa/pernas/elmo, goblins, morcegos,
  magos, Necromante, runas, chaves, portal).
- Colisão AABB com paredes; projéteis com teleguiamento; partículas; textos de dano flutuantes.
- Escuridão dinâmica (composição `destination-out`) nas catacumbas.
- `window.__game` — gancho para depuração/automação de testes.
