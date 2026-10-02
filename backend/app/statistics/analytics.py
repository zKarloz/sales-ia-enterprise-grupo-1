from statistics import mean, median


SALES = [
    {
        "amount": 32000,
        "seller": "juan",
        "category": "technology",
    },
    {
        "amount": 38500,
        "seller": "ana",
        "category": "furniture",
    },
    {
        "amount": 34200,
        "seller": "carlos",
        "category": "office",
    },
    {
        "amount": 42100,
        "seller": "juan",
        "category": "technology",
    },
    {
        "amount": 46800,
        "seller": "ana",
        "category": "furniture",
    },
    {
        "amount": 48250,
        "seller": "carlos",
        "category": "office",
    },
]


def calculate_statistics(
    seller: str = "all",
    category: str = "all",
):
    filtered_sales = SALES

    if seller != "all":
        filtered_sales = [
            sale
            for sale in filtered_sales
            if sale["seller"] == seller
        ]

    if category != "all":
        filtered_sales = [
            sale
            for sale in filtered_sales
            if sale["category"] == category
        ]

    amounts = [
        sale["amount"]
        for sale in filtered_sales
    ]

    if not amounts:
        return {
            "total_sales": 0,
            "total_customers": 0,
            "total_orders": 0,
            "average_sale": 0,
            "mean": 0,
            "median": 0,
            "sales_by_period": [],
        }

    return {
        "total_sales": sum(amounts),
        "total_customers": len(amounts),
        "total_orders": len(amounts),
        "average_sale": sum(amounts) / len(amounts),
        "mean": mean(amounts),
        "median": median(amounts),
        "sales_by_period": amounts,
    }
