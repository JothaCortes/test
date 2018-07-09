import Joi from 'joi'
import moment from 'moment-timezone'
import fs from 'fs';
import cloudant from '../../config/db.js';
import configEnv from '../../config/env_status.js';
import { validate, clean, format }  from 'rut.js'

let db = cloudant.db.use(configEnv.db)

const Tools = [{ // todos los clientes habilitados
  method: 'GET',
  path: '/api/tools/getServerTime',
  options: {
    handler: (request, h) => {
      return new Promise(resolve => {
        resolve(moment().tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'))
      })
    }
  }
},
{
  method: 'POST',
  path: '/api/tools/uploadImgLog',
  options: {
    handler: (request, h) => {
        let img = request.payload.img.replace(/^data:image\/jpeg;base64,/, "");
        let id = request.payload.id;
        
      return new Promise(resolve => {
        fs.writeFile(`img_logs/${id}.jpeg`, img, 'base64', function(err) {
          console.log(err);

          resolve({ok: 'Imagen subida correctamente'});
        });        
      });
    },
    validate: {
      payload: Joi.object().keys({
        id: Joi.string().required(),
        img: Joi.string().required()
      })
    }
  }
}, 
{
    method: 'POST',
    path: '/api/tools/firstsearch',
    options: {
      handler: (request, h) => {
        let session = request.auth.credentials;
        let type = request.payload.type;
        let val = request.payload.val;
        let query;

        console.log(type, val)

        return new Promise(resolve=> {
            if (type == 'email') {
                query = {
                    selector: {
                        _id: {
                            $gte: null
                        },
                        type: 'alumnos',
                        email: val.replace(/ /g,''),
                        $not: {
                            status: 'disabled'
                        },
                        city: session.place
                    }
                }
            } else if (type == 'rut') {
                query = {
                    selector: {
                        _id: val.replace(/ /g,''),
                        type: 'alumnos',
                        $not: {
                            status: 'disabled'
                        },
                        city: session.place
                    }
                }
            } else {
                /*
                let splitval = val.split(' ');
    
                let name = splitval[0];
                let lastname = val.substr(val.indexOf(' ') + 1);
                */

                //TODO: agregar busqueda de apellido en primer parámetro
                query = {
                    selector: {
                        _id: {
                            $gte: null
                        },
                        type: 'alumnos',
                        $or: [
                            {
                                name: {
                                    $regex: `(?i)${val}`
                                }
                            },
                            {
                                lastname1: {
                                    $regex: `(?i)${val}`,
                                }  
                            },
                            {
                                lastname2: {
                                    $regex: `(?i)${val}`,
                                }  
                            },
                        ],
                        city: session.place
                    }    
                }  
            }

            db.find(query, (err, result) => {
                if (err) throw err
                
                console.log(result)
                if(result.docs[0]) {
                    resolve({ok:result.docs});
                } else {
                    resolve({err:'No se encontraron alumnos'});
                }
            })
        })

      },
      validate: {
        payload: Joi.object().keys({
          type: Joi.string().required(),
          val: Joi.string().required()
        })
      }
    }
}, 
];

export default Tools
