# Diaporama

Visionneuse locale de photos et vidéos : glissez-déposez un dossier dans le navigateur, parcourez-le en plein écran (sous-dossiers inclus), zoomez, lancez l'autoplay. Tout se passe dans le navigateur, rien n'est envoyé.

**Démo : [www.ludiq.be/diaporama](https://www.ludiq.be/diaporama/)**

React 19 / Vite 6, JavaScript + JSDoc. Aucune donnée ne quitte le navigateur : pas de serveur, pas de télémétrie, fonctionne hors ligne une fois installé.

Compatibilité : navigateurs desktop supportant `webkitGetAsEntry` (Chrome, Edge, Firefox, Safari). Pas de version mobile.

## Lancer

```bash
npm install
npm run dev
```

Puis glisser-déposer un dossier sur la page. Un nouveau dossier peut être déposé à tout moment pendant la lecture pour remplacer le courant.

Autres scripts : `build`, `preview`, `lint`.

## Raccourcis

| Touche | Action |
| --- | --- |
| `←` / `→` | Précédent / suivant (déplace l'image si zoomée) |
| `↑` / `↓` | Déplacement vertical (image zoomée) |
| Molette, `+` / `-` | Zoom 0,1× – 10× |
| `1`–`9`, `0` | Zoom direct (`0`/`1` = reset) |
| Glisser souris | Déplacer l'image zoomée |
| `Entrée` | Ouvrir le sous-dossier |
| `PageUp` / `Échap` | Remonter au dossier parent (ou fermer l'aide) |
| `Espace` | Lecture / pause |
| `a` / `z` | Cadence autoplay −/+ 0,5 s |
| `h` | Aide |

## Configuration

`src/config/SlideshowConfig.json` : `autoplay` (bool), `order` (`"normal"` | `"reverse"`), `displayTime` (ms, min 500), `loop` (bool).

Formats : jpg, jpeg, png, gif, bmp, webp, avif, mp4, webm, ogg, mov. Les fichiers illisibles sont ignorés, le tri est naturel (`img2` avant `img10`).

Métadonnées affichées : nom, date de modification, date de prise de vue EXIF (`DateTimeOriginal`).

## Contribuer

JavaScript pur avec typage JSDoc (pas de TypeScript), modules ES. Lancer `npm run lint` avant toute PR. Le dossier `logs/` contient l'index du code et le journal des évolutions, `plans/` les plans d'implémentation.

## Licence

[MIT](LICENSE) — Ludiq Playground - Christophe Gossiaux.
