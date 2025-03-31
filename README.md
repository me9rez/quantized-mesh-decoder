Quantized Mesh Decoder

===========================================

[![npm version](https://img.shields.io/npm/v/@deepgis/quantized-mesh-decoder?color=red)](https://npmjs.com/package/@deepgis/quantized-mesh-decoder)
[![npm downloads](https://img.shields.io/npm/dm/@deepgis/quantized-mesh-decoder?color=yellow)](https://npm.chart.dev/@deepgis/quantized-mesh-decoder)

> Fork from [Here Quantized Mesh Decoder](https://github.com/heremaps/quantized-mesh-decoder)

## Enhanced Capabilities

- Improved type definitions (TypeScript support)
- Comprehensive test cases ensuring decoding accuracy

JavaScript decoder for the [Quantized Mesh format](https://github.com/CesiumGS/quantized-mesh).


## Installation

### In Node.js

The module is installable via pnpm:

```sh
pnpm install @deepgis/quantized-mesh-decoder
```

### API Reference

```javascript
import {decode} from '@deepgis/quantized-mesh-decoder'

decode(buffer, options)
```

* buffer: [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
* options: [DecoderOptions](#decoderoptions)

##### DecoderOptions

* maxDecodingStep: Number  
  Limits how deep decoder should go.  Takes of the properties of the `DECODING_STEPS` map. See `import { DECODING_STEPS } from '@deepgis/quantized-mesh-decoder' `.   
  Default: `DECODING_STEPS.extensions`.


### Links

* [Quantized Mesh Specification](https://github.com/CesiumGS/quantized-mesh)
* [Quantized Mesh Viewer](https://github.com/me9rez/quantized-mesh-viewer)
* [TIN Terrain](https://github.com/heremaps/tin-terrain) — tool that generates Quantized Mesh tiles out of GeoTIFF

### Sample Tiles Attribution

- `./src/assets/tile-with-extensions.terrain`: [Cesium World Terrain from Cesium ion](https://cesiumjs.org/Cesium/Build/Apps/Sandcastle/index.html?src=Terrain.html)
- `./src/assets/tile-opentin.terrain`: [Open data](ftp://geoftp.ibge.gov.br//modelos_digitais_de_superficie/modelo_digital_de_elevacao_mde/rj25/tif/mde_27453ne_v1.zip) from brazilian government [IBGE](https://ww2.ibge.gov.br/english/), processed using [TIN Terrain](https://github.com/heremaps/tin-terrain)

