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
    min: [-2, 'Exposure cannot be less than -2'],
    max: [2, 'Exposure cannot be more than 2']
  },
  brightness: {
    type: Number,
    default: 1,
    min: [0.5, 'Brightness cannot be less than 0.5'],
    max: [1.5, 'Brightness cannot be more than 1.5']
  },
  contrast: {
    type: Number,
    default: 1,
    min: [0.5, 'Contrast cannot be less than 0.5'],
    max: [2, 'Contrast cannot be more than 2']
  },
  saturate: {
    type: Number,
    default: 1,
    min: [0, 'Saturation cannot be negative'],
    max: [2, 'Saturation cannot be more than 2']
  },
  hue_rotate: {
    type: Number,
    default: 0,
    min: [0, 'Hue rotation cannot be negative'],
    max: [360, 'Hue rotation cannot be more than 360 degrees']
  },
  grayscale: {
    type: Number,
    default: 0,
    min: [0, 'Grayscale cannot be negative'],
    max: [1, 'Grayscale cannot be more than 1']
  },
  blur: {
    type: Number,
    default: 0,
    min: [0, 'Blur cannot be negative'],
    max: [10, 'Blur cannot be more than 10px']
  },
  opacity: {
    type: Number,
    default: 1,
    min: [0, 'Opacity cannot be negative'],
    max: [1, 'Opacity cannot be more than 1']
  }
}, {
  timestamps: true
})

FilterSettingsSchema.index({ video_id: 1 })

export default mongoose.models.FilterSettings || mongoose.model('FilterSettings', FilterSettingsSchema)
