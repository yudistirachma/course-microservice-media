const express = require('express')
const router = express.Router()
const isBase64 = require('is-base64')
const base64Img = require('base64-img')
const fs = require('fs')

const { Media } = require('../models')

// get all images
router.get('/',  async(req, res) => {
  const media = await Media.findAll({
    attributes: ['id', 'image']
  })

  const urlMedia = media.map(m => {
    m.image = `${req.get('host')}/${m.image}`
    return m
  })

  return res.json({
    status: true,
    data: urlMedia
  })
})

// get media by id
router.get('/:id', async(req, res) => {
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
      image: `${req.get('host')}/${media.image}`
    }
  })
})

// post media
router.post('/', function(req, res) {
  const image = req.body.image

  if (!isBase64(image, { mimeRequired:true })) {
    return res.status(400).json({ status: false, message: 'invalid base64' })
  }

  base64Img.img(image, 'public/images', Date.now(), async(err, filePath) => {
    if (err) {
      return res.status(400).json({ status: false, message: err.message })
    }

    const fileName = filePath.split('\\').pop().split('/').pop()
    
    const media = await Media.create({ image: `images/${fileName}` })
    
    return res.json({
      status: true,
      data: {
        id: media.id,
        image: `${req.get('host')}/images/${fileName}`
      }
    })
  })
})

// delete media
router.delete('/:id', async(req, res) => {
  const id = req.params.id

  const media = await Media.findOne({
    where: { id }
  })

  console.log(media)
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
})

module.exports = router
