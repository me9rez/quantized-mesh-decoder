export interface Header {
  centerX?: number
  centerY?: number
  centerZ?: number
  minHeight?: number
  maxHeight?: number
  boundingSphereCenterX?: number
  boundingSphereCenterY?: number
  boundingSphereCenterZ?: number
  boundingSphereRadius?: number
  horizonOcclusionPointX?: number
  horizonOcclusionPointY?: number
  horizonOcclusionPointZ?: number
}

export type HeaderKeys = keyof Header

export const QUANTIZED_MESH_HEADER = new Map<HeaderKeys, number>([
  ['centerX', Float64Array.BYTES_PER_ELEMENT],
  ['centerY', Float64Array.BYTES_PER_ELEMENT],
  ['centerZ', Float64Array.BYTES_PER_ELEMENT],

  ['minHeight', Float32Array.BYTES_PER_ELEMENT],
  ['maxHeight', Float32Array.BYTES_PER_ELEMENT],

  ['boundingSphereCenterX', Float64Array.BYTES_PER_ELEMENT],
  ['boundingSphereCenterY', Float64Array.BYTES_PER_ELEMENT],
  ['boundingSphereCenterZ', Float64Array.BYTES_PER_ELEMENT],
  ['boundingSphereRadius', Float64Array.BYTES_PER_ELEMENT],

  ['horizonOcclusionPointX', Float64Array.BYTES_PER_ELEMENT],
  ['horizonOcclusionPointY', Float64Array.BYTES_PER_ELEMENT],
  ['horizonOcclusionPointZ', Float64Array.BYTES_PER_ELEMENT]
])



export type TileDataView = DataView<ArrayBufferLike>

export function decodeZigZag(value: number) {
  return (value >> 1) ^ (-(value & 1))
}

export function decodeHeader(dataView: TileDataView) {
  let position = 0
  const header: Header = {}

  for (let [key, bytesCount] of QUANTIZED_MESH_HEADER) {
    const getter = bytesCount === 8 ? dataView.getFloat64 : dataView.getFloat32

    header[key] = getter.call(dataView, position, true)
    position += bytesCount
  }

  return { header, headerEndPosition: position }
}

export function decodeVertexData(dataView: TileDataView, headerEndPosition: number) {
  let position = headerEndPosition
  const elementsPerVertex = 3
  const vertexCount = dataView.getUint32(position, true)
  const vertexData = new Uint16Array(vertexCount * elementsPerVertex)

  position += Uint32Array.BYTES_PER_ELEMENT

  const bytesPerArrayElement = Uint16Array.BYTES_PER_ELEMENT
  const elementArrayLength = vertexCount * bytesPerArrayElement
  const uArrayStartPosition = position
  const vArrayStartPosition = uArrayStartPosition + elementArrayLength
  const heightArrayStartPosition = vArrayStartPosition + elementArrayLength

  let u = 0
  let v = 0
  let height = 0

  for (let i = 0; i < vertexCount; i++) {
    u += decodeZigZag(dataView.getUint16(uArrayStartPosition + bytesPerArrayElement * i, true))
    v += decodeZigZag(dataView.getUint16(vArrayStartPosition + bytesPerArrayElement * i, true))
    height += decodeZigZag(dataView.getUint16(heightArrayStartPosition + bytesPerArrayElement * i, true))

    vertexData[i] = u
    vertexData[i + vertexCount] = v
    vertexData[i + vertexCount * 2] = height
  }

  position += elementArrayLength * 3

  return { vertexData, vertexDataEndPosition: position }
}

export function decodeIndex(buffer: ArrayBufferLike, position: number, indicesCount: number, bytesPerIndex: number, encoded = true) {
  let indices: Uint16Array | Uint32Array

  if (bytesPerIndex === 2) {
    indices = new Uint16Array(buffer, position, indicesCount)
  } else {
    indices = new Uint32Array(buffer, position, indicesCount)
  }

  if (!encoded) {
    return indices
  }

  let highest = 0

  for (let i = 0; i < indices.length; ++i) {
    let code = indices[i]

    indices[i] = highest - code

    if (code === 0) {
      ++highest
    }
  }

  return indices
}

export function decodeTriangleIndices(dataView: TileDataView, vertexData: Uint16Array<ArrayBuffer>, vertexDataEndPosition: number) {
  let position = vertexDataEndPosition
  const elementsPerVertex = 3
  const vertexCount = vertexData.length / elementsPerVertex
  const bytesPerIndex = vertexCount > 65536
    ? Uint32Array.BYTES_PER_ELEMENT
    : Uint16Array.BYTES_PER_ELEMENT

  if (position % bytesPerIndex !== 0) {
    position += bytesPerIndex - (position % bytesPerIndex)
  }

  const triangleCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const triangleIndicesCount = triangleCount * 3
  const triangleIndices = decodeIndex(
    dataView.buffer,
    position,
    triangleIndicesCount,
    bytesPerIndex
  )
  position += triangleIndicesCount * bytesPerIndex

  return {
    triangleIndicesEndPosition: position,
    triangleIndices
  }
}

export function decodeEdgeIndices(dataView: TileDataView, vertexData: Uint16Array<ArrayBuffer>, triangleIndicesEndPosition: number) {
  let position = triangleIndicesEndPosition
  const elementsPerVertex = 3
  const vertexCount = vertexData.length / elementsPerVertex
  const bytesPerIndex = vertexCount > 65536
    ? Uint32Array.BYTES_PER_ELEMENT
    : Uint16Array.BYTES_PER_ELEMENT

  const westVertexCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const westIndices = decodeIndex(dataView.buffer, position, westVertexCount, bytesPerIndex, false)
  position += westVertexCount * bytesPerIndex

  const southVertexCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const southIndices = decodeIndex(dataView.buffer, position, southVertexCount, bytesPerIndex, false)
  position += southVertexCount * bytesPerIndex

  const eastVertexCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const eastIndices = decodeIndex(dataView.buffer, position, eastVertexCount, bytesPerIndex, false)
  position += eastVertexCount * bytesPerIndex

  const northVertexCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const northIndices = decodeIndex(dataView.buffer, position, northVertexCount, bytesPerIndex, false)
  position += northVertexCount * bytesPerIndex

  return {
    edgeIndicesEndPosition: position,
    westIndices,
    southIndices,
    eastIndices,
    northIndices
  }
}

export function decodeVertexNormalsExtension(extensionDataView: TileDataView) {
  return new Uint8Array(
    extensionDataView.buffer, extensionDataView.byteOffset, extensionDataView.byteLength
  )
}

export function decodeWaterMaskExtension(extensionDataView: TileDataView) {
  return extensionDataView.buffer.slice(
    extensionDataView.byteOffset,
    extensionDataView.byteOffset + extensionDataView.byteLength
  )
}

export function decodeMetadataExtension(extensionDataView: TileDataView) {
  const jsonLength = extensionDataView.getUint32(0, true)

  let jsonString = ''
  for (let i = 0; i < jsonLength; ++i) {
    jsonString += String.fromCharCode(extensionDataView.getUint8(Uint32Array.BYTES_PER_ELEMENT + i))
  }

  return JSON.parse(jsonString)
}

export function decodeExtensions(dataView: TileDataView, indicesEndPosition: number) {
  const extensions: {
    [key: string]: any
  } = {}

  if (dataView.byteLength <= indicesEndPosition) {
    return { extensions, extensionsEndPosition: indicesEndPosition }
  }

  let position = indicesEndPosition

  while (position < dataView.byteLength) {
    const extensionId = dataView.getUint8(position)
    position += Uint8Array.BYTES_PER_ELEMENT

    const extensionLength = dataView.getUint32(position, true)
    position += Uint32Array.BYTES_PER_ELEMENT

    const extensionView = new DataView(dataView.buffer, position, extensionLength)

    switch (extensionId) {
      case 1: {
        extensions.vertexNormals = decodeVertexNormalsExtension(extensionView)

        break
      }
      case 2: {
        extensions.waterMask = decodeWaterMaskExtension(extensionView)

        break
      }
      case 4: {
        extensions.metadata = decodeMetadataExtension(extensionView)

        break
      }
      default: {
        console.warn(`Unknown extension with id ${extensionId}`)
      }
    }

    position += extensionLength
  }

  return { extensions, extensionsEndPosition: position }
}

export const DECODING_STEPS = {
  header: 0,
  vertices: 1,
  triangleIndices: 2,
  edgeIndices: 3,
  extensions: 4
}

const DEFAULT_OPTIONS = {
  maxDecodingStep: DECODING_STEPS.extensions
}

export function decode(data: ArrayBufferLike, userOptions?: {
  maxDecodingStep?: number
}) {
  const options = Object.assign({}, DEFAULT_OPTIONS, userOptions)
  const view = new DataView(data)
  const { header, headerEndPosition } = decodeHeader(view)

  if (options.maxDecodingStep < DECODING_STEPS.vertices) {
    return { header }
  }

  const { vertexData, vertexDataEndPosition } = decodeVertexData(view, headerEndPosition)

  if (options.maxDecodingStep < DECODING_STEPS.triangleIndices) {
    return { header, vertexData }
  }

  const {
    triangleIndices,
    triangleIndicesEndPosition
  } = decodeTriangleIndices(view, vertexData, vertexDataEndPosition)

  if (options.maxDecodingStep < DECODING_STEPS.edgeIndices) {
    return { header, vertexData, triangleIndices }
  }

  const {
    westIndices,
    southIndices,
    eastIndices,
    northIndices,
    edgeIndicesEndPosition
  } = decodeEdgeIndices(view, vertexData, triangleIndicesEndPosition)

  if (options.maxDecodingStep < DECODING_STEPS.extensions) {
    return {
      header,
      vertexData,
      triangleIndices,
      westIndices,
      northIndices,
      eastIndices,
      southIndices
    }
  }

  const { extensions } = decodeExtensions(view, edgeIndicesEndPosition)

  return {
    header,
    vertexData,
    triangleIndices,
    westIndices,
    northIndices,
    eastIndices,
    southIndices,
    extensions
  }
}
