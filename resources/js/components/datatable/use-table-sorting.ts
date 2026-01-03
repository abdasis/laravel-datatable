import { useState } from 'react'

function useTableSorting(initialColumn = '', initialType = 'asc') {
    const [columnSorted, setColumnSorted] = useState(initialColumn); // Kolom yang diurutkan
    const [typeSort, setTypeSort] = useState(initialType); // Jenis sorting (asc atau desc)

    // Fungsi untuk menangani perubahan kolom atau tipe urutan
    const handleSorting = (columnKey: string) => {
        // Jika kolomnya sama, hanya ubah tipe sorting (toggle asc/desc)
        if (columnKey === columnSorted) {
            setTypeSort((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            // Jika kolom baru dipilih, reset ke urutan 'asc'
            setColumnSorted(columnKey);
            setTypeSort('asc');
        }
    };

    return {
        columnSorted,
        typeSort,
        handleSorting,
        setColumnSorted,
        setTypeSort,
    };
}

export default useTableSorting;
