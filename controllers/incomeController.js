import incomeModel from "../models/incomeModel.js";
import XLSX from "xlsx";
import getDateRange from "../utils/datafilter.js";

// add income
export async function addIncome(req, res) {
    const userId = req.user._id;
    const { description, amount, category, date } = req.body;

    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const newIncome = new incomeModel({
            userId,
            description,
            amount,
            category,
            date: new Date(date)
        });
        await newIncome.save();
        res.json({
            success: true,
            message: "Income added successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
}

// to get income(all)
export async function getAllIncome(req, res) {
    const userId = req.user._id;
    try {
        const income = await incomeModel.find({ userId }).sort({ date: -1 });
        res.json(income);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


// update an income
export async function updateIncome(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const { description, amount } = req.body;

    try {
        const updateIncome = await incomeModel.findOneAndUpdate(
            { _id: id, userId },
            { description, amount },
            { new: true }
        );

        if (!updateIncome) {
            return res.status(404).json({
                success: false,
                message: "Income not found"
            });
        }
        req.json({
            success: true,
            message: "Income updated successfully",
            data: updateIncome
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

// to delete an income
export async function deleteIncome(req, res) {
    try {
        const income = await incomeModel.findByIdAndDelete({ _id: req.params.id });
        if (!income) {
            return res.status(404).json({
                success: false,
                message: "Income not found"
            });
        }
        return res.json({
            success: true,
            message: "Income deleted successfully"
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

// to download the income data in excel sheet
export async function downloadIncomeExcel(req, res) {
    const userId = req.user._id;
    try {
        const income = await incomeModel.find({ userId }).sort({ date: -1 });
        const plainData = income.map((inc) => ({
            Description: inc.description,
            Amount: inc.amount,
            Category: inc.category,
            Date: new Date(inc.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "incomeModel");
        XLSX.writeFile(workbook, "income_details.xlsx");
        res.download("income_details.xlsx");

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

// to get income overview
export async function getIncomeOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "month" } = req.query;
        const { start, end } = getDateRange(range);
        const income = await incomeModel.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: -1 });



        const totalIncome = income.reduce((acc, cur) => acc + cur.amount, 0);
        const averageIncome = income.length > 0 ? totalIncome / income.length : 0;
        const numberOfTransactions = income.length;

        const recentTransactions = income.slice(0, 9);

        res.json({
            success: true,
            data: {
                totalIncome,
                averageIncome,
                numberOfTransactions,
                recentTransactions,
                range
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}