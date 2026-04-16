import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BookOpen, Edit, Loader2, Plus, Trash2, Pencil, PlusCircle } from "lucide-react";
import { useToast } from "@/context/toastContext";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { TMCategory } from "@/lib/models/hr-settings";
import { useFirestore } from "@/context/firestore-context";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { TRAINING_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/training-management";
import { useAuth } from "@/context/authContext";

// Helper function to recursively find and update a category
const findAndManipulateCategory = (
    categories: TMCategory[],
    id: string,
    action: (category: TMCategory, parent?: TMCategory) => void,
): boolean => {
    for (const category of categories) {
        if (category.id === id) {
            action(category);
            return true;
        }
        if (category.subcategory && category.subcategory.length > 0) {
            if (findAndManipulateCategory(category.subcategory, id, c => action(c, category))) {
                return true;
            }
        }
    }
    return false;
};

export const TrainingCategory = () => {
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();

    const [categories, setCategories] = useState<TMCategory[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<TMCategory | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [formData, setFormData] = useState<{ name: string; active: "Yes" | "No" }>({
        name: "",
        active: "Yes",
    });

    useEffect(() => {
        setCategories(hrSettings.tmCategories || []);
    }, [hrSettings.tmCategories]);

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const resetForm = () => {
        setFormData({ name: "", active: "Yes" });
        setEditingItem(null);
        setSelectedParentId(null);
    };

    const handleAddNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleAddSubcategory = (parentId: string) => {
        resetForm();
        setSelectedParentId(parentId);
        setIsModalOpen(true);
    };

    const handleEdit = (item: TMCategory) => {
        resetForm();
        setEditingItem(item);
        setFormData({ name: item.name, active: item.active });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast("Category Name is required", "Error", "error");
            return;
        }
        setIsSaving(true);

        try {
            if (editingItem) {
                const updatedCategories = JSON.parse(JSON.stringify(categories));
                let rootCategoryToUpdate: TMCategory | null = null;

                for (const rootCat of updatedCategories) {
                    if (rootCat.id === editingItem.id) {
                        rootCategoryToUpdate = rootCat;
                        rootCat.name = formData.name;
                        rootCat.active = formData.active;
                        break;
                    }
                    if (
                        findAndManipulateCategory([rootCat], editingItem.id, cat => {
                            cat.name = formData.name;
                            cat.active = formData.active;
                            rootCategoryToUpdate = rootCat;
                        })
                    )
                        break;
                }

                if (rootCategoryToUpdate) {
                    const { id, ...dataToUpdate } = rootCategoryToUpdate;
                    await hrSettingsService.update(
                        "tmCategories",
                        id,
                        dataToUpdate,
                        userData?.uid,
                        TRAINING_MANAGEMENT_LOG_MESSAGES.TRAINING_CATEGORY_UPDATED({
                            id: id,
                            name: formData.name,
                            active: formData.active === "Yes",
                        }),
                    );
                    showToast("Category updated successfully", "Success", "success");
                }
            } else if (selectedParentId) {
                const newSubcategory: TMCategory = {
                    id: crypto.randomUUID(),
                    name: formData.name,
                    active: formData.active,
                    subcategory: [],
                    timestamp: getTimestamp(),
                };

                const updatedCategories = JSON.parse(JSON.stringify(categories));
                let rootCategoryToUpdate: TMCategory | null = null;

                for (const rootCat of updatedCategories) {
                    if (rootCat.id === selectedParentId) {
                        rootCat.subcategory.push(newSubcategory);
                        rootCategoryToUpdate = rootCat;
                        break;
                    }
                    if (
                        findAndManipulateCategory([rootCat], selectedParentId, cat => {
                            cat.subcategory.push(newSubcategory);
                            rootCategoryToUpdate = rootCat;
                        })
                    )
                        break;
                }

                if (rootCategoryToUpdate) {
                    const { id, ...dataToUpdate } = rootCategoryToUpdate;
                    await hrSettingsService.update(
                        "tmCategories",
                        id,
                        dataToUpdate,
                        userData?.uid,
                        TRAINING_MANAGEMENT_LOG_MESSAGES.TRAINING_CATEGORY_UPDATED({
                            id: id,
                            name: formData.name,
                            active: formData.active === "Yes",
                        }),
                    );
                    showToast("Subcategory added successfully", "Success", "success");
                }
            } else {
                const newCategory: Omit<TMCategory, "id"> = {
                    name: formData.name,
                    active: formData.active,
                    subcategory: [],
                    timestamp: getTimestamp(),
                };
                await hrSettingsService.create(
                    "tmCategories",
                    newCategory,
                    userData?.uid,
                    TRAINING_MANAGEMENT_LOG_MESSAGES.TRAINING_CATEGORY_CREATED({
                        name: newCategory.name,
                        active: newCategory.active === "Yes",
                    }),
                );
                showToast("Category created successfully", "Success", "success");
            }

            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save category:", error);
            showToast("An error occurred", "Error", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (idToDelete: string) => {
        confirm("Are you sure? This may also delete all subcategories.", async () => {
            let isTopLevel = categories.some(c => c.id === idToDelete);

            if (isTopLevel) {
                await hrSettingsService.remove(
                    "tmCategories",
                    idToDelete,
                    userData?.uid,
                    TRAINING_MANAGEMENT_LOG_MESSAGES.TRAINING_CATEGORY_DELETED(idToDelete),
                );
                showToast("Category deleted successfully", "Success", "success");
            } else {
                const updatedCategories = JSON.parse(JSON.stringify(categories));
                let rootCategoryToUpdate: TMCategory | null = null;

                for (const rootCat of updatedCategories) {
                    if (
                        findAndManipulateCategory([rootCat], idToDelete, (cat, parent) => {
                            if (parent) {
                                parent.subcategory = parent.subcategory.filter(
                                    sub => sub.id !== idToDelete,
                                );
                                rootCategoryToUpdate = rootCat;
                            }
                        })
                    )
                        break;
                }

                if (rootCategoryToUpdate) {
                    const { id, ...dataToUpdate } = rootCategoryToUpdate as TMCategory;
                    await hrSettingsService.update(
                        "tmCategories",
                        id,
                        dataToUpdate,
                        userData?.uid,
                        TRAINING_MANAGEMENT_LOG_MESSAGES.TRAINING_CATEGORY_UPDATED({
                            id: id,
                            name: formData.name,
                            active: formData.active === "Yes",
                        }),
                    );
                    showToast("Subcategory deleted successfully", "Success", "success");
                }
            }
        });
    };

    const renderCategoryRow = (item: TMCategory, depth = 0): React.ReactNode => {
        const hasChildren = item.subcategory && item.subcategory.length > 0;
        const isExpanded = expandedRows.has(item.id);

        return (
            <React.Fragment key={item.id}>
                <TableRow className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell className="p-3 dark:text-white">
                        <div
                            className="flex items-center"
                            style={{ paddingLeft: `${depth * 24}px` }}
                        >
                            {hasChildren ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 mr-2"
                                    onClick={() => toggleRow(item.id)}
                                >
                                    {isExpanded ? "−" : "+"}
                                </Button>
                            ) : (
                                <span className="w-8 mr-2" />
                            )}
                            {item.name}
                        </div>
                    </TableCell>
                    <td className="p-3 text-gray-600 dark:text-gray-400">
                        {hasChildren ? `${item.subcategory.length} subcategories` : "—"}
                    </td>
                    <td className="p-3">
                        <Badge variant={item.active === "Yes" ? "default" : "secondary"}>
                            {item.active === "Yes" ? "Active" : "Inactive"}
                        </Badge>
                    </td>
                    <td className="p-3">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSubcategory(item.id)}
                                className="border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800"
                            >
                                <PlusCircle className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-gray-800"
                            >
                                <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </td>
                </TableRow>
                {isExpanded &&
                    hasChildren &&
                    item.subcategory.map(child => renderCategoryRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <Card className="dark:bg-black">
            <CardHeader className="flex flex-row items-center justify-between dark:bg-black">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                    <CardTitle className="dark:text-white">Training Categories</CardTitle>
                </div>
                <Button
                    onClick={handleAddNew}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </CardHeader>
            <CardContent className="dark:bg-black">
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <TableHead className="p-3 font-medium text-gray-700 dark:text-gray-300">
                                    Category Name
                                </TableHead>
                                <TableHead className="p-3 font-medium text-gray-700 dark:text-gray-300">
                                    Subcategories
                                </TableHead>
                                <TableHead className="p-3 font-medium text-gray-700 dark:text-gray-300">
                                    Status
                                </TableHead>
                                <TableHead className="p-3 font-medium text-gray-700 dark:text-gray-300">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length > 0 ? (
                                categories.map(category => renderCategoryRow(category))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center p-8 text-gray-500"
                                    >
                                        No categories found. Start by adding a new one.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="dark:bg-black">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">
                                {editingItem
                                    ? "Edit Training Category"
                                    : selectedParentId
                                        ? "Add Subcategory"
                                        : "Add Training Category"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? "Update the details for this category."
                                    : "Fill out the form to add a new category."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="name" className="dark:text-gray-300">
                                    Category Name
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="Enter category name"
                                    className="dark:bg-gray-900 dark:text-white"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label htmlFor="active" className="dark:text-gray-300">
                                    Status
                                </Label>
                                <Select
                                    value={formData.active}
                                    onValueChange={(value: "Yes" | "No") =>
                                        setFormData(prev => ({ ...prev, active: value }))
                                    }
                                >
                                    <SelectTrigger className="dark:bg-gray-900 dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-black dark:text-white">
                                        <SelectItem value="Yes">Active</SelectItem>
                                        <SelectItem value="No">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isSaving ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>

            {ConfirmDialog}
        </Card>
    );
};
