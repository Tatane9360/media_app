import mongoose from 'mongoose'

const FilterSettingsSchema = new mongoose.Schema({
  video_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: [true, 'Video ID is required'],
    unique: true
  },
  exposure: {
    type: Number,
    default: 0,
    min: [-100, 'Exposure cannot be less than -100'],
    max: [100, 'Exposure cannot be more than 100']
  },
  brightness: {
    type: Number,
    default: 0,
    min: [-100, 'Brightness cannot be less than -100'],
    max: [100, 'Brightness cannot be more than 100']
  },
  contrast: {
    type: Number,
    default: 0,
    min: [-100, 'Contrast cannot be less than -100'],
    max: [100, 'Contrast cannot be more than 100']
  },
  saturation: {
    type: Number,
    default: 0,
    min: [-100, 'Saturation cannot be less than -100'],
    max: [100, 'Saturation cannot be more than 100']
  },
  hue: {
    type: Number,
    default: 0,
    min: [-180, 'Hue cannot be less than -180'],
    max: [180, 'Hue cannot be more than 180']
  },
  grayscale: {
    type: Number,
    default: 0,
    min: [0, 'Grayscale cannot be negative'],
    max: [100, 'Grayscale cannot be more than 100']
  },
  sepia: {
    type: Number,
    default: 0,
    min: [0, 'Sepia cannot be negative'],
    max: [100, 'Sepia cannot be more than 100']
  },
  invert: {
    type: Number,
    default: 0,
    min: [0, 'Invert cannot be negative'],
    max: [100, 'Invert cannot be more than 100']
  },
  blur: {
    type: Number,
    default: 0,
    min: [0, 'Blur cannot be negative'],
    max: [20, 'Blur cannot be more than 20']
  },
  gamma: {
    type: Number,
    default: 1,
    min: [0.1, 'Gamma cannot be less than 0.1'],
    max: [3, 'Gamma cannot be more than 3']
  },
  opacity: {
    type: Number,
    default: 100,
    min: [0, 'Opacity cannot be negative'],
    max: [100, 'Opacity cannot be more than 100']
  }
}, {
  timestamps: true
})

FilterSettingsSchema.index({ video_id: 1 })

export default mongoose.models.FilterSettings || mongoose.model('FilterSettings', FilterSettingsSchema)
