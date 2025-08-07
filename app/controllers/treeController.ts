import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { treeSchema } from '../utils/shemasJoi';
import loadTreeMapper from '../mappers/treeMapper';
import { Tree } from '../types/index';
import { sanitizeInput } from '../utils/sanitizeInput';

const treeMapper = new loadTreeMapper();

const treeController = { 

    // ALL TREES

    trees: catchAsync(async (req:Request, res:Response, next: NextFunction) => {

        // Query parameters
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const offset = parseInt(req.query.offset as string, 10) || 0; 
        const sortBy = req.query.sortBy as string;
        const withCount = req.query.withCount === 'true';

        let trees: Tree[] = [];
        let total: number | undefined;

        // Check if sortBy or withCount are defined
        if (sortBy === 'price') {
            const result = await treeMapper.treesByPrice(limit, offset);
            trees = result.data;
            total = result.total;
        } else {
            const result = await treeMapper.findAllWithCount(limit, offset);
            trees = result.data;
            total = result.total; 
        }
        if (!trees || trees.length === 0) {
            return next(new AppError("No trees found", 404)); 
        }

        res.status(200).json({trees, total});
    }),

    treesWithForests: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
                
        const trees = await treeMapper.treesWithForests();
        if (!trees || trees.length === 0) {
            return next(new AppError("No trees found", 404));
        }
        
        res.status(200).json(trees);
    }),    

    // ONE TREE

    treeById: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
       
        const id = parseInt(req.params.id, 10);
        
        const tree = await treeMapper.findById(id);
        if (!tree) {
            return next(new AppError(`Tree with ${id} not found`, 404));
        }

        res.status(200).json(tree);
    }),

    treeWithForestsAndStock: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
        
        const id = parseInt(req.params.id, 10);

        const tree = await treeMapper.findById(id);
        if (!tree) {
            return next(new AppError(`Tree with ${id} not found`, 404));
        }

        const trees = await treeMapper.treeWithForestsAndStock(id);

        res.status(200).json(trees);
    }),

    // ASSOCIATION & FILTERS

    treesByForest: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
        
        const id = parseInt(req.params.id, 10);

        const trees = await treeMapper.treesByForest(id);
        if (trees.length === 0) {
            return next(new AppError(`No trees found for forest with id ${id}`, 404));
        }

        res.status(200).json(trees);
    }),

    treesByCountry: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
        
        const slug = req.params.slug;

        const trees = await treeMapper.treesByCountry(slug);
        if (trees.length === 0) {
            return next(new AppError(`No trees found for slug ${slug}`, 404));
        }

        res.status(200).json(trees);
    }),
    
    treesByCategory: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
        
        const slug = req.params.slug;

        const trees = await treeMapper.treesByCategory(slug);
        if (trees.length === 0) {
            return next(new AppError(`No trees found for slug ${slug}`, 404));
        }

        res.status(200).json(trees);
    }),

    // POST, PATCH & DELETE

    addTree: catchAsync(async (req:Request, res:Response, next: NextFunction) => {

        const sanitizedBody = sanitizeInput(req.body);
        sanitizedBody.forestAssociations = Object.values(sanitizedBody.forestAssociations);
        const { error, value } = treeSchema.validate(sanitizedBody);
        if (error) {
            return next(new AppError("Invalid data", 400));
        }
        
        // Extraction of `forestAssociations` from `value` and assignment of the other properties of `value` to `treeData`.
        const { forestAssociations, ...treeData } = value;
    
        const newTree = await treeMapper.create(treeData);

        // If `forestAssociations` is not empty and is an array, we associate the new tree with the specified forests
        if (forestAssociations.length > 0 && Array.isArray(forestAssociations)) {
            await treeMapper.addTreeToForests(newTree.id, forestAssociations);
        }

        res.status(201).json(newTree);
    }),

    updateTree: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
        
        const id = parseInt(req.params.id, 10);
        const sanitizedBody = sanitizeInput(req.body);
        sanitizedBody.forestAssociations = Object.values(sanitizedBody.forestAssociations);
        
        const { error, value } = treeSchema.validate(sanitizedBody);
        if (error) {
            return next(new AppError("Invalid data", 400));
        }

        const { forestAssociations, ...treeData } = value;

        // find tree
        const tree = await treeMapper.findById(id);
        if (!tree) {
            return next(new AppError(`Tree with ${id} not found`, 404));
        }

        // update tree
        const updatedTree = await treeMapper.update(id, treeData);

        // If `forestAssociations` is not empty and is an array, we associate the updated tree with the specified forests.
        if (forestAssociations && Array.isArray(forestAssociations)) {
            await treeMapper.updateTreeToForests(id, forestAssociations);
        }
        
        res.status(200).json(updatedTree);
    }),
    
    deleteTree: catchAsync(async (req:Request, res:Response) => {

        const id = parseInt(req.params.id, 10);

        const tree = await treeMapper.findById(id);
        if (!tree) {
            return res.status(404).json({ message: "Tree not found" });
        }

        const treeWithForests = await treeMapper.treeWithForestsAndStock(id);
        if (treeWithForests && treeWithForests.forestName && treeWithForests.forestName.length > 0) {
            return res.status(400).json({ message: "Impossible de supprimer cet arbre car il est associé à une ou plusieurs forêts." });
        }

        const hasOrders = await treeMapper.hasOrders(id);
        if (hasOrders) {
            return res.status(400).json({
            message: "Impossible de supprimer cet arbre car il est lié à une ou plusieurs commandes.",
            });
        }

        await treeMapper.delete(id);

        res.status(200).send("Tree deleted");
    }),

}

export default treeController;