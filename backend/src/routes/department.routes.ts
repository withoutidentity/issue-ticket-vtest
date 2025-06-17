import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware'
import { PrismaClient } from '@prisma/client'


const router = Router();
const prisma = new PrismaClient()

//GET /api/departments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        group_id: true,
        thread_id: true, // This will fetch the String[]
        it_target_thread_index: true,
        // Add other fields you might need here
      }
    });

    // Transform thread_id array into separate fields for frontend
    const formattedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      group_id: dept.group_id,
      it_target_thread_index: dept.it_target_thread_index,
      raw_thread_ids: dept.thread_id, // Include the raw array for IT display
      thread_id_inprogress: dept.thread_id && dept.thread_id.length > 0 ? dept.thread_id[0] : null,
      thread_id_done: dept.thread_id && dept.thread_id.length > 1 ? dept.thread_id[1] : null, // Assuming index 1 is 'done'
    }));
    res.json(formattedDepartments);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/departments/create
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, group_id, thread_id_inprogress, thread_id_done, it_target_thread_index } = req.body; // รับค่าจาก frontend

    if (!name) {
      res.status(400).json({ success: false,
        message: 'Department name is required'
      });
      return
    }
    
    let itTargetThreadIndexParsed: number | null = null;
    if (it_target_thread_index !== undefined && it_target_thread_index !== null && String(it_target_thread_index).trim() !== '') {
        const parsed = parseInt(it_target_thread_index, 10);
        if (!isNaN(parsed)) {
            itTargetThreadIndexParsed = parsed;
        } else {
            res.status(400).json({ success: false, message: 'Invalid IT Target Thread Index format for creation' });
            return 
        }
    }

    // สร้าง array thread_id จากค่าที่รับมา
    const newThreadIdArray = [
      thread_id_inprogress || null,
      thread_id_done || null
    ].filter((id): id is string => id !== null);

    const result = await prisma.department.create({
      data:{
        name,
        group_id: group_id || null,
        thread_id: newThreadIdArray, // บันทึกเป็น array
        it_target_thread_index: itTargetThreadIndexParsed,
      }
  });


    res.status(201).json({success: true, data: result}); // Changed to 201 and consistent response
  } catch (error) {
    console.error(error);
    // Handle Prisma unique constraint error for name if necessary
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002' && 
        'meta' in error && error.meta && typeof error.meta === 'object' && 
        'target' in error.meta && Array.isArray(error.meta.target) && 
        (error.meta.target as string[]).includes('name')) { // Type assertion for error.meta.target
        res.status(409).json({
            success: false,
            message: 'Department name already exists',
            error: 'Unique constraint violation'
        });
        return  
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/departments/update/:id
router.put('/update/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const departmentId = parseInt(req.params.id, 10);
    if (isNaN(departmentId)) {
      res.status(400).json({ success: false, message: 'Invalid Department ID' });
      return 
    }

    const { name, group_id, thread_id_inprogress, thread_id_done, it_target_thread_index } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Department name is required' });
      return 
    }

    let itTargetThreadIndexParsed: number | null = null;
    if (it_target_thread_index !== undefined && it_target_thread_index !== null && String(it_target_thread_index).trim() !== '') {
        const parsed = parseInt(it_target_thread_index, 10);
        if (!isNaN(parsed)) {
            itTargetThreadIndexParsed = parsed;
        } else {
            // If it's an empty string from input that means clear it, it should be null
            if (String(it_target_thread_index).trim() === '') {
                 itTargetThreadIndexParsed = null;
            } else {
                res.status(400).json({ success: false, message: 'Invalid IT Target Thread Index format' });
                return 
            }
        }
    } else if (it_target_thread_index === null) { // Explicitly passed as null
        itTargetThreadIndexParsed = null;
    }

    const departmentToUpdate = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!departmentToUpdate) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return 
    }

    let newThreadIdsForDb: string[]; // Prisma schema for thread_id is String[]

    if (departmentToUpdate.name === 'it') {
      if (req.body.raw_thread_ids !== undefined) {
        if (!Array.isArray(req.body.raw_thread_ids)) {
          res.status(400).json({ success: false, message: 'raw_thread_ids must be an array for IT department' });
          return 
        }
        // Convert all elements to string, treating null/undefined as empty string, as Prisma String[] cannot store nulls.
        newThreadIdsForDb = (req.body.raw_thread_ids as any[]).map(id => {
          if (id === null || id === undefined) return '';
          return String(id);
        });
      } else {
        // If raw_thread_ids is not in payload for IT, keep existing ones
        newThreadIdsForDb = departmentToUpdate.thread_id;
      }
    } else { // For non-IT departments
      const currentThreadIds = departmentToUpdate.thread_id || []; 

      const inProgressFromRequest = req.body.thread_id_inprogress;
      const doneFromRequest = req.body.thread_id_done;

      const tempArray: (string | null)[] = [null, null];

      tempArray[0] = inProgressFromRequest !== undefined ? (inProgressFromRequest || null) : (currentThreadIds.length > 0 ? currentThreadIds[0] : null);
      tempArray[1] = doneFromRequest !== undefined ? (doneFromRequest || null) : (currentThreadIds.length > 1 ? currentThreadIds[1] : null);
      
      // Filter out nulls to store only actual string IDs, consistent with create logic
      newThreadIdsForDb = tempArray.filter((id): id is string => id !== null && id.trim() !== '');
    }

    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name,
        group_id: group_id !== undefined ? group_id : departmentToUpdate.group_id,
        thread_id: newThreadIdsForDb,
        it_target_thread_index: it_target_thread_index !== undefined ? itTargetThreadIndexParsed : departmentToUpdate.it_target_thread_index,
      },
    });
    // Return formatted department similar to GET
    const responseData = {
      ...updatedDepartment, // Includes raw_thread_ids if added to select
      thread_id_inprogress: updatedDepartment.thread_id && updatedDepartment.thread_id.length > 0 ? updatedDepartment.thread_id[0] : null,
      thread_id_done: updatedDepartment.thread_id && updatedDepartment.thread_id.length > 1 ? updatedDepartment.thread_id[1] : null,
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error(error);
     if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002' && 
        'meta' in error && error.meta && typeof error.meta === 'object' && 
        'target' in error.meta && Array.isArray(error.meta.target) && 
        (error.meta.target as string[]).includes('name')) { // Type assertion
        res.status(409).json({
            success: false,
            message: 'Department name already exists',
            error: 'Unique constraint violation'
        }); 
        return 
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.delete('/delete/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false,
        message: 'Invalid Department ID'
      });
      return 
    }
    
    // Check if department exists before attempting to delete
    const departmentExists = await prisma.department.findUnique({ where: { id } });
    if (!departmentExists) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return 
    }

    const result = await prisma.department.delete({
      where: {
        id: id
      }
    })
    res.status(200).json({success: true, data: result, message: "Department deleted successfully"}); // Consistent response
  } catch (error) {
    console.error(error);
    // Handle cases where delete fails due to foreign key constraints (P2003)
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003' &&
        'meta' in error && error.meta && typeof error.meta === 'object' && 
        'target' in error.meta && Array.isArray(error.meta.target) && 
        (error.meta.target as string[]).includes('name')) { // This condition might be too specific for P2003, usually it's about field_name
        res.status(409).json({
             success: false,
             message: 'Cannot delete department as it is referenced by other records.',
             error: 'Foreign key constraint violation'
        }); 
        return 
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/check/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
     if (isNaN(id)) { // Added validation for ID
      res.status(400).json({ success: false, message: 'Invalid Department ID' });
      return 
    }
    
    const isUsed = await prisma.ticket.findFirst({ 
      where: { department_id: id } 
    });

    // You might want to check other relations as well if a department can be "used" in other ways

    res.json({ isUsed: !!isUsed }); // ส่งกลับเป็น true/false
  } catch (error) {
    console.error('Error checking department usage:', error); // Added more specific log
    res.status(500).json({ success: false, message: 'Server error while checking department usage' }); // Consistent error response
  }
});

export default router;
