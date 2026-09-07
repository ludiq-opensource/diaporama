# 001-index — Catalogue du codebase

Projet : **my-slideshow** (Diaporama) — application React/Vite locale de diaporama interactif (images, vidéos, navigation hiérarchique par dossiers via drag & drop).

Dernière mise à jour : 2026-09-07

## Racine

- [README.md](../README.md) — Présentation open source : lancement, confidentialité, compatibilité, raccourcis, config, contribuer, licence (md). Réécrit le 2026-09-07.
- [LICENSE](../LICENSE) — Licence MIT, Ludiq Playground - Christophe Gossiaux (texte). Créé le 2026-09-07.
- [package.json](../package.json) — Métadonnées (name diaporama, 1.0.0, MIT, author, repository), dépendances (react 19, vite 6, exifr), scripts (json). Modifié le 2026-09-07.
- [package-lock.json](../package-lock.json) — Lockfile npm (json).
- [.gitignore](../.gitignore) — Exclusions git ; `.devin` ajouté le 2026-09-07 (règles agent non distribuées) (texte).
- [index.html](../index.html) — Point d'entrée HTML Vite (html). Modifié le 2026-09-04 (lang fr, titre « Diaporama », favicon projet).
- [vite.config.js](../vite.config.js) — Configuration Vite : plugin react, `base: './'` pour un build statique déployable à tout chemin (js). Modifié le 2026-09-07.
- [eslint.config.js](../eslint.config.js) — Configuration ESLint flat (js). Modifié le 2026-09-04 (react version detect, react/prop-types off — typage JSDoc).
- [public/favicon.ico](../public/favicon.ico) — Favicon du projet (ico). Ajouté le 2026-09-04 (remplace vite.svg, supprimé).

## src/ — code applicatif

- [src/main.jsx](../src/main.jsx) — Bootstrap React (StrictMode, createRoot) (jsx).
- [src/App.jsx](../src/App.jsx) — Composant racine : état `directory`, bascule DropZone/Diaporama (jsx). Modifié le 2026-09-07 (C5, console.log retiré).
- [src/index.css](../src/index.css) — Styles globaux : reset marges, pleine hauteur (css).
- [src/components/DropZone.jsx](../src/components/DropZone.jsx) — Zone de dépôt de répertoire, mode initial (style noir cohérent avec le viewer) et mode `global` pendant la lecture (jsx). Modifié le 2026-09-07 (C4, dragleave via relatedTarget).
- [src/components/Diaporama.jsx](../src/components/Diaporama.jsx) — Visualiseur : navigation dossiers, autoplay, zoom/drag, raccourcis clavier, lightbox d'aide (touche h), métadonnées EXIF via exifr (jsx). Modifié le 2026-09-07 (plan corrections review n°3 : startIndex reverse, re-clamp offset, rootRef, measureRendered/resize, filtres clavier, sans fileCreated).
- [src/utils/readDirectory.js](../src/utils/readDirectory.js) — Lecture non-récursive d'un répertoire déposé (webkitGetAsEntry) : filtrage par extensions image/vidéo, fichiers illisibles ignorés, tri naturel insensible à la casse (js). Modifié le 2026-09-07 (B1, C1, C6).
- [src/config/SlideshowConfig.json](../src/config/SlideshowConfig.json) — Config du diaporama : `autoplay`, `order`, `displayTime`, `loop` (json).
- `src/App.css`, `src/assets/` (react.svg), `public/vite.svg` — assets du template Vite supprimés le 2026-09-04 (inutilisés, jamais importés).

## .devin/ — règles et skills agent

- [.devin/rules/developper-agent.md](../.devin/rules/developper-agent.md) — Règles agent développeur (méthode, index/logs, pas de commit sans workflow) (md).
- [.devin/rules/backend-guidelines.md](../.devin/rules/backend-guidelines.md) — Pattern backend route-controller-service (contexte Node/Fastify, non utilisé ici) (md).
- [.devin/rules/front-guidelines.md](../.devin/rules/front-guidelines.md) — Pattern frontend page-controller-service React (md).
- [.devin/rules/plans-structure.md](../.devin/rules/plans-structure.md) — Structure des plans d'implémentation dans `/plans` (md).
- [.devin/rules/start-implementation.md](../.devin/rules/start-implementation.md) — Protocole de démarrage d'implémentation (md).
- [.devin/rules/ponytail.md](../.devin/rules/ponytail.md) — Mode "lazy senior dev" (minimalisme de code) (md).
- [.devin/rules/codebase.md](../.devin/rules/codebase.md) — Rappel de lire l'index dans `/logs` (md).
- [.devin/rules/read-docs-files.md](../.devin/rules/read-docs-files.md) — Rappel de lire `/docs` et `/logs` (md).
- [.devin/skills/commit-and-push/SKILL.md](../.devin/skills/commit-and-push/SKILL.md) — Workflow commit/push (md).
- [.devin/skills/open-markdown-document/SKILL.md](../.devin/skills/open-markdown-document/SKILL.md) — Skill d'ouverture de documents markdown (md).
- [.devin/skills/read-logs/SKILL.md](../.devin/skills/read-logs/SKILL.md) — Skill de lecture des logs (md).
- [.devin/skills/read-rules/SKILL.md](../.devin/skills/read-rules/SKILL.md) — Skill de lecture des règles (md).
- [.devin/skills/dashboard/SKILL.md](../.devin/skills/dashboard/SKILL.md) — Skill dashboard (md).

## plans/ — plans d'implémentation

- [plans/2026-09-03-01-corrections-review.md](../plans/2026-09-03-01-corrections-review.md) — Plan des 7 corrections post-review du 2026-09-03, checklist complétée + rapport final (md).
- [plans/2026-09-04-01-robustesse-proprete.md](../plans/2026-09-04-01-robustesse-proprete.md) — Plan robustesse/propreté (13 points, log 005), implémentation non démarrée (md).
- [plans/2026-09-04-02-corrections-review.md](../plans/2026-09-04-02-corrections-review.md) — Plan des corrections de la review n°3 (15 points, 3 phases A/B/C, log 024), checklist complétée 15/15 + rapport final le 2026-09-07 (md).

## docs/ — documentation et rapports

- [docs/2026-09-04-02-review.md](../docs/2026-09-04-02-review.md) — Rapport de la 3e review (log 023) : 4 bugs logique, 5 points robustesse, 6 mineurs, priorisation (md). Créé le 2026-09-04.

## logs/ — suivi du projet

- [logs/001-index.md](001-index.md) — Ce fichier : catalogue du codebase (md). Créé le 2026-09-03.
- [logs/001-log.md](001-log.md) — Journal chronologique des actions (md). Créé le 2026-09-03.

## Exclus de l'index

- `node_modules/` — dépendances installées.
- `dist/` — build de production (vide).
- Fichiers système (`.DS_Store`).
