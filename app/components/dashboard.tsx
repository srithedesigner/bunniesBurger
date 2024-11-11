'use client'

import { useEffect, useState } from 'react'
import { Search, ArrowLeft} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dish, DishProps } from "./dish"
import { Table, TableProps } from "./table"
import { OrderSummary } from './order_summary'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Image from 'next/image'




const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)


interface selectedDishes {
    [tableId: number]: {
        [dishId: number]: number
    }
}





export default function RestaurantBilling() {
    const [tables, setTables] = useState<TableProps[]>([])
    const [selectedTable, setSelectedTable] = useState<TableProps | null>(null)
    const [selectedDishes, setSelectedDishes] = useState<selectedDishes>({})
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [categories, setCategories] = useState<string[]>([])
    const [dishes, setDishes] = useState<DishProps[]>([])
    const [loading, setLoading] = useState(true)

    const router = useRouter()

    useEffect(() => {
        const fetchSession = async () => {
            const {data, error} = await supabase.auth.getSession();
            if (error) {
                console.log("Error fetching session: ", error);
            }
            console.log("session", data.session);
            if (!data.session) {
                router.push('/');
            } else {
                setLoading(false);
            }
        };
    
        fetchSession();
    
        const fetchDataAndSubscribe = async () => {
            await fetchCategories();
            await fetchDishesWithCategories();
            await fetchTables();
            await fetchOrderDetails();
    
            const dishesSubscription = supabase
                .channel('dishes-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
                    fetchDishesWithCategories();
                })
                .subscribe();
    
            const categoriesSubscription = supabase
                .channel('categories-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
                .subscribe();
    
            const tableSubscription = supabase
                .channel('tables-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchTables)
                .subscribe();
    
            const orderDetailsSubscription = supabase
                .channel('order_details-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'order_details' }, fetchOrderDetails)
                .subscribe();
    

            return () => {
                supabase.removeChannel(dishesSubscription);
                supabase.removeChannel(categoriesSubscription);
                supabase.removeChannel(tableSubscription);
                supabase.removeChannel(orderDetailsSubscription);
            };
        };
    
        fetchDataAndSubscribe();
    
    });

    if (loading) {
        return (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          }}>
            <Image
              src="/burger.gif"
              alt="BunniesBurger"
            />

          </div>
        );
      }
    

    

    async function fetchCategories() {

        const {data, error} = await supabase
            .from('categories')
            .select('*')
        if (error) {
            console.log("Error fetching categories: ", error)
        }
        if (data) {
            setCategories(data.map((category) => category.name))
        }
        console.log("categories", categories)
    }

    async function fetchTables() {

        const {data, error} = await supabase
            .from('tables')
            .select('*')
        if (error) {
            console.log("Error fetching tables: ", error)
        }
        if (data) {
            console.log("tables", data)
            setTables(data.map((table) => {
                return({
                    key: table.key,
                    name: table.name,
                    total: table.total
                })
            }))
        }
    }

    function firstAvailableTable() : number {
        const n = tables.length;
        const seen: boolean[] = new Array(n + 1).fill(false);

        for (const table of tables) {
            if (table.key > 0 && table.key <= n) {
                seen[table.key] = true;
            }
        }

        for (let i = 1; i <= n; i++) {
            if (!seen[i]) {
                return i;
            }
        }
        return n + 1;
    }

    async function fetchDishesWithCategories() {

        const { data, error } = await supabase
            .from('dishes')
            .select(`
            *,
            categories!inner(name)
        `);

        if (error) {
            console.error('Error fetching dishes with categories:', error);
        } else {
            setDishes(
                data.map((dish) => {
                    return ({
                        key: dish.key,
                        name: dish.name,
                        price: dish.price,
                        category: dish.categories.name
                    })
                }
                )
            )
        }
    }

    async function fetchOrderDetails() {
        const { data, error } = await supabase
            .from('order_details')
            .select('*');

        if (error) {
            console.error('Error fetching order details:', error);
        } else {
            const selectedDishes: selectedDishes = {};
            for (const orderDetail of data) {
                selectedDishes[orderDetail.table_id] = {
                    ...selectedDishes[orderDetail.table_id],
                    [orderDetail.dish_id]: orderDetail.quantity
                }
            }
            setSelectedDishes(selectedDishes);
        }    
    }

    async function addTotal(tableId: number, price: number) {
        const {data, error} = await supabase
                                .from('tables')
                                .select('total')
                                .eq('key', tableId)
        if (error) {
            console.log("Error fetching total: ", error)
        }
        console.log("add total data", data)
        if (data) {
            const newTotal = data[0].total + price
            const {error: updateError} = await supabase
                .from('tables')
                .update({total: newTotal})
                .eq('key', tableId)
            if (updateError) {
                console.log("Error updating total: ", updateError)
            }
        }
    }

    async function updateDBOrderDetail(tableId: number, dishId: number, isAdd: boolean) {
        console.log('Updating order details:', tableId, dishId, isAdd);
        const { data, error: checkError } = await supabase
            .from('order_details')
            .select('*')
            .eq('table_id', tableId)
            .eq('dish_id', dishId)
            .single();

        if (checkError) {
            console.log('Error checking record:', checkError);
        }
        //checking if the dish is already there in the table.
        if (data) {
            if (isAdd) {
                const newQuantity = data.quantity + 1;
                const { error: updateError } = await supabase
                    .from('order_details')
                    .update({ quantity: newQuantity })
                    .eq('key', data.key);

                if (updateError) {
                    console.log('Error updating quantity:', updateError);
                } else {
                    console.log('Quantity updated:', newQuantity);
                    addTotal(tableId, dishes.find(dish => dish.key === dishId)?.price || 0)
                }


            } else {
                if (data.quantity > 1) {
                    const newQuantity = data.quantity - 1;
                    const { error: updateError } = await supabase
                        .from('order_details')
                        .update({ quantity: newQuantity })
                        .eq('key', data.key);

                    if (updateError) {
                        console.log('Error updating quantity:', updateError);
                    } else {
                        console.log('Quantity decreased:', newQuantity);
                    }
                } else {
                    const { error: deleteError } = await supabase
                        .from('order_details')
                        .delete()
                        .eq('key', data.key);

                    if (deleteError) {
                        console.log('Error deleting record:', deleteError);
                    } else {
                        console.log('Record deleted');
                    }
                }

                const dish = dishes.find(dish => dish.key === dishId);
                addTotal(tableId, -1 * (dish?.price || 0));

            }
        } else {
            // dish is not in the table.
            if (isAdd) {
                const { error: insertError } = await supabase
                    .from('order_details')
                    .insert({ table_id: tableId, dish_id: dishId, quantity: 1 });

                if (insertError) {
                    console.log('Error inserting record:', insertError);
                } else {
                    console.log('New record inserted with quantity 1');
                    addTotal(tableId, dishes.find(dish => dish.key === dishId)?.price || 0)
                }
            } else {
                console.log('No record found to delete or decrease');
            }
        }


    }

    async function updateDBTable (tableId: number) {
        const {error} = await supabase
                        .from('tables')
                        .insert({key: tableId, name: `table ${tableId}`, total: 0})
        if (error) {
            console.log("Error updating tables: ", error)
        }
    }
    

    const addTable = () => {

        const table_key = firstAvailableTable()
        updateDBTable(table_key)
        const newTable = { key: table_key, name: `table ${table_key}`, total: 0 }
        setTables([...tables, newTable])
    }

    const addDish = (tableId: number, dishId: number) => {
        updateDBOrderDetail(tableId, dishId, true)

        setSelectedDishes(prev => ({
            ...prev,
            [tableId]: {
                ...prev[tableId],
                [dishId]: (prev[tableId]?.[dishId] || 0) + 1
            }
        }))
    }

    const removeDish = (tableId: number, dishId: number) => {
        updateDBOrderDetail(tableId, dishId, false)

        setSelectedDishes(prev => {
            const updatedDishes = { ...prev[tableId] }
            if (updatedDishes[dishId] > 1) {
                updatedDishes[dishId]--
            } else {
                delete updatedDishes[dishId]
            }
            return { ...prev, [tableId]: updatedDishes }
        })
    }


    const filteredDishes = dishes.filter(dish =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === 'All' || dish.category === selectedCategory)
    )

    console.log("filtered dishes", filteredDishes)

    const getOrderedDishes = (tableId: number) => {
        return Object.entries(selectedDishes[tableId] || {}).map(([dishId, quantity]) => {
            const dish = dishes.find(d => d.key === parseInt(dishId))
            return dish ? { ...dish, quantity } : null
        }).filter((dish): dish is DishProps & { quantity: number } => dish !== null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
        <header className="bg-primary text-primary-foreground p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-3xl font-bold">BunniesBurger</h1>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2">
                            Hi, User
                        </span>
                        <Button variant="secondary" size="sm">
                            Logout
                        </Button>
                    </div>
            </div>
        </header>
        <main className="container mx-auto p-6 max-w-7xl">

            {!selectedTable ? (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-semibold">Tables</h2>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="lg">Add New table</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New table</DialogTitle>
                                </DialogHeader>
                                <Button onClick={addTable}>Add table</Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tables.map(table => (
                            <Table
                                key={table.key}
                                name={table.name}
                                total={table.total}
                                onClick={() => setSelectedTable(table)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <Button variant="ghost" size="lg" onClick={() => setSelectedTable(null)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tables
                        </Button>
                        <h2 className="text-3xl font-semibold">{selectedTable.name.toUpperCase()}</h2>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="w-full lg:w-1/2">
                            <OrderSummary
                                tableName={selectedTable.name}
                                dishes={getOrderedDishes(selectedTable.key)}
                                dishQuantity={selectedDishes[selectedTable.key] || {}}
                                onIncrease={(dishId: number) => addDish(selectedTable.key, dishId)}
                                onDecrease={(dishId: number) => removeDish(selectedTable.key, dishId)}
                                onPrint={() => window.print()}
                            />
                        </div>
                        <div className="w-full lg:w-1/2">
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Button
                                        variant={selectedCategory === 'All' ? "default" : "outline"}
                                        onClick={() => setSelectedCategory('All')}
                                    >
                                        All
                                    </Button>
                                    {categories.map(category => (
                                        <Button
                                            key={category}
                                            variant={selectedCategory === category ? "default" : "outline"}
                                            onClick={() => setSelectedCategory(category)}
                                        >
                                            {category}
                                        </Button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Search dishes..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                            </div>
                            <ScrollArea className="h-[calc(100vh-300px)]">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pr-4">
                                    {filteredDishes.map(dish => (
                                        <Dish
                                            key={dish.key}
                                            name={dish.name}
                                            price={dish.price}
                                            category={dish.category}
                                            onClick={() => addDish(selectedTable.key, dish.key)}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            )}
        </main>
        </div>
    )
}