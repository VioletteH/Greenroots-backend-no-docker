import type { Request, Response } from "express";
import { sanitizeInput } from '../utils/sanitizeInput';
import { searchMapper } from "../mappers/searchMapper";
import { catchAsync } from "../utils/catchAsync";

const searchController = catchAsync(async (req:Request, res:Response): Promise<void> => {

    const query = req.query.search as string;
    if(!query) {
        res.status(400).json({ message: "Search query is required" });
        return;
    }
    
    const sanitizedQuery = sanitizeInput(query);

    const searchResults = await searchMapper(sanitizedQuery);

    if (searchResults.length === 0) {
        res.status(404).json("No results found");
        return;
    }
    res.status(200).json(searchResults);
});

export default searchController;