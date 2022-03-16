const express = require('express')
const router = express.Router()
const isBase64 = require('is-base64')
const base64Img = require('base64-img')

const { Media } = require('../models')

router.get('/',  async(req, re) => {
  const media = await Media.findAll()
  console.log(media)

  return res.json({
    status: true,
    media: media
  })
})

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
    
    const media = await Media.create({ image: `images/${fileName}` });
    
    return res.json({
      status: true,
      data: {
        id: media.id,
        image: `${req.get('host')}/images/${fileName}`
      }
    })
  })
});

module.exports = router
