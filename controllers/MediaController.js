const isBase64 = require('is-base64')
const base64Img = require('base64-img')
const fs = require('fs')

const { Media } = require('../models')

const index = async (req, res) => {
  const media = await Media.findAll({
    attributes: ['id', 'image']
  })

  const urlMedia = media.map(m => {
    m.image = `http://${req.get('host')}/${m.image}`
    return m
  })

  return res.json({
    status: true,
    data: urlMedia
  })
}

const show = async (req, res) => {
  const media = await Media.findOne({
      where: {
        id: req.params.id
      }
  })

  if (!media) {
      return res.json({
        status: false,
        data: 'Media not found'
      })
  }
  
  return res.json({
      status: true,
      data: {
        id: media.id,
        image: `http://${req.get('host')}/${media.image}`
      }
  })
}

const store = async (req, res) => {
  const image = req.body.image

  if (!isBase64(image, { mimeRequired:true })) {
    return res.status(400).json({ status: false, message: 'invalid base64' })
  }

  base64Img.img(image, 'public/images', Date.now(), async(err, filePath) => {
    if (err) {
      return res.status(400).json({ status: false, message: err.message })
    }

    console.log(filePath)

    const fileName = filePath.split('\\').pop().split('/').pop()
    
    const media = await Media.create({ image: `images/${fileName}` })
    
    return res.json({
      status: true,
      data: {
        id: media.id,
        image: `http://${req.get('host')}/images/${fileName}`
      }
    })
  })
}

const destroy = async (req, res) => {
  const id = req.params.id

  const media = await Media.findOne({
    where: { id }
  })

  if (!media) {
    return res.status(400).json({ status: false, message: 'media not found' })
  }

  fs.unlink(`public/${media.image}`, async(err) => {
    if (err) {
      return res.status(400).json({ status: false, message: err.message })
    }

    await media.destroy()
      .then(() => {
        return res.json({
          status: true,
          data: `image with id ${id} has been deleted`
        })
      })
      .catch(() => {
        return res.status(400).json({ 
          status: false, 
          message: 'something error with server' 
        })
      }) 
  })
}

module.exports = {
  index,
  show,
  store,
  destroy
}