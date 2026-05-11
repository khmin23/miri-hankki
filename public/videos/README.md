# Restaurant Videos

Place restaurant videos here and connect them from `src/data/restaurants.js`.

Expected filenames:

- `puan-interior.mp4`, `puan-route.mp4`
- `muvet-interior.mp4`, `muvet-route.mp4`
- `casabusano-interior.mp4`, `casabusano-route.mp4`
- `walking-holiday-interior.mp4`, `walking-holiday-route.mp4`
- `namakjip-interior.mp4`, `namakjip-route.mp4`
- `baohaus-interior.mp4`, `baohaus-route.mp4`

After adding a file, set the matching `media.*.src` value to the same public path, for example:

```js
media: {
  interior: { src: '/videos/namakjip-interior.mp4', poster: '', suggestedPath: '/videos/namakjip-interior.mp4' },
  route: { src: '/videos/namakjip-route.mp4', poster: '', suggestedPath: '/videos/namakjip-route.mp4' },
}
```
