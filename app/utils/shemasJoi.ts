import Joi, { optional } from 'joi';

// LOGIN

export const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
      'string.email': "L'adresse e-mail doit être valide.",
      'string.empty': "L'adresse e-mail est requise.",
      'any.required': "L'adresse e-mail est requise.",
    }),

  password: Joi.string().trim().required().messages({
      'string.empty': "Le mot de passe est requis.",
      'any.required': "Le mot de passe est requis.",
    }),
});

// REGISTER

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
      'string.email': "L'adresse e-mail doit être valide.",
      'string.empty': "L'adresse e-mail est requise.",
      'any.required': "L'adresse e-mail est requise.",
    }),
  password: Joi.string().min(8).required().messages({
      'string.min': "Le mot de passe doit contenir au moins 8 caractères.",
      'string.empty': "Le mot de passe est requis.",
      'any.required': "Le mot de passe est requis.",
    }),
  firstname: Joi.string().trim().max(255).required().messages({
      'string.max': "Le prénom ne peut pas dépasser 255 caractères.",
      'string.empty': "Le prénom est requis.",
      'any.required': "Le prénom est requis.",
    }),
});

// TREE

export const treeSchema = Joi.object({
  name: Joi.string().required(),
  scientific_name: Joi.string().required(),
  image: Joi.string().required(),
  category: Joi.string().required(),
  description: Joi.string().required(),
  co2: Joi.number().precision(2).positive().required(),
  o2: Joi.number().precision(2).positive().required(),
  price: Joi.number().precision(2).positive().required(),
  forestAssociations: Joi.array().items(
    Joi.object({
      forestId: Joi.number().integer().positive().required(),
      stock: Joi.number().integer().positive().required(),
    })
  ).optional()
});

// FOREST

export const forestSchema = Joi.object({
  name: Joi.string().required(),
  association: Joi.string().required(),
  image: Joi.string().required(),
  description: Joi.string().required(),
  country: Joi.string().required(),
  location_x: Joi.number().precision(6).required(),
  location_y: Joi.number().precision(6).required(),
  treeAssociations: Joi.array().items(
    Joi.object({
      treeId: Joi.number().integer().positive().required(),
      stock: Joi.number().integer().positive().required(),
    })
  ).optional()
});

// ORDER

// order (required fields)
export const orderSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  total_price: Joi.number().precision(2).positive().required(),
  status: Joi.number().integer().required()
});

// orderUpdate (not required fields) 
export const orderUpdateSchema = Joi.object({
  user_id: Joi.number().integer().positive(),
  total_price: Joi.number().precision(2).positive(),
  status: Joi.number().integer().valid(1, 2, 3)
});

// USER

// userBaseSchema
export const userBaseSchema = Joi.object({
  firstname: Joi.string().trim().max(255).optional(),
  lastname: Joi.string().trim().max(255).optional(),
  email: Joi.string().email().trim().lowercase().messages({
    'string.email': 'Email invalide',
    'string.empty': 'Email requis',
    'any.required': 'Email requis',
  }),
  password: Joi.string().min(8).messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'string.empty': 'Mot de passe requis',
    'any.required': 'Mot de passe requis',
  }),
  phone: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  zipcode: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  role: Joi.string().optional(),
});

// userSchema (required fields)
export const userSchema = userBaseSchema.keys({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin', 'user').required(), 
});

// userUpdate (not required fields) 
export const userUpdateSchema = userBaseSchema.keys({
  email: Joi.string().email().trim().lowercase().optional(),
  password: Joi.string().min(8).optional(),
});

// userUpdate BO (not required, forbidden password)
export const userUpdateSchemaBackOffice = userBaseSchema.keys({
  role: Joi.string().valid('admin', 'user').optional(),
  password: Joi.forbidden().messages({
    'any.unknown': 'Le mot de passe ne peut pas être modifié ici.',
  }),
}).unknown(true); // allow other fields to be present

