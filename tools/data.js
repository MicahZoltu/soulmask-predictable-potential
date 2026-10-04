// Crop-planner dataset generated from the Soulmask cooked assets (recipe graph + harvest loot) by the extraction documented in docs/. Rates are items per minute per large farm plot, net of seed self-replenishment.
(function (root, factory) {
	if (typeof module === "object" && module.exports) module.exports = factory();
	else root.CROP_DATA = factory();
})(typeof self !== "undefined" ? self : this, function () {
	return {
	 "crops": {
	  "daoju_item_agave_leaf": {
	   "name": "Agave Leaf",
	   "rate": 0.067
	  },
	  "daoju_item_aloe_leaf": {
	   "name": "Aloe Leaf",
	   "rate": 0.2
	  },
	  "daoju_item_cashewnuts": {
	   "name": "Cashew",
	   "rate": 0.056
	  },
	  "daoju_item_chili": {
	   "name": "Chili",
	   "rate": 0.333
	  },
	  "daoju_item_coco": {
	   "name": "Cocoa Fruit",
	   "rate": 0.019
	  },
	  "daoju_item_corn": {
	   "name": "Corn",
	   "rate": 0.389
	  },
	  "daoju_item_cotton": {
	   "name": "Cotton",
	   "rate": 0.2
	  },
	  "daoju_item_pawpaw": {
	   "name": "Papaya",
	   "rate": 0.15
	  },
	  "daoju_item_peanut": {
	   "name": "Peanut",
	   "rate": 0.333
	  },
	  "daoju_item_pomegranate": {
	   "name": "Guava",
	   "rate": 0.045
	  },
	  "daoju_item_potatoes": {
	   "name": "Potato",
	   "rate": 0.267
	  },
	  "daoju_item_pumpkin": {
	   "name": "Pumpkin",
	   "rate": 0.24
	  },
	  "daoju_item_quinoa": {
	   "name": "Quinoa",
	   "rate": 0.178
	  },
	  "daoju_item_tobacco": {
	   "name": "Tobacco",
	   "rate": 0.167
	  },
	  "daoju_item_tomatoes": {
	   "name": "Tomato",
	   "rate": 0.333
	  },
	  "daoju_item_mint": {
	   "name": "Mint",
	   "rate": 0.6
	  },
	  "daoju_item_wheat": {
	   "name": "Wheat",
	   "rate": 0.467
	  },
	  "daoju_item_flax": {
	   "name": "Flax",
	   "rate": 0.6
	  },
	  "daoju_item_gingeli": {
	   "name": "Sesame",
	   "rate": 0.667
	  },
	  "daoju_item_grape": {
	   "name": "Grape",
	   "rate": 0.467
	  },
	  "daoju_item_chufa": {
	   "name": "Tigernut",
	   "rate": 0.6
	  },
	  "daoju_item_garlic": {
	   "name": "Garlic",
	   "rate": 0.6
	  },
	  "daoju_item_onion": {
	   "name": "Onion",
	   "rate": 0.4
	  },
	  "daoju_item_fig": {
	   "name": "Fig",
	   "rate": 0.3
	  },
	  "daoju_item_date": {
	   "name": "Date Palm",
	   "rate": 0.075
	  }
	 },
	 "foods": [
	  {
	   "id": "DaoJu_Item_Beer",
	   "name": "Beer",
	   "variants": [
	    {
	     "label": "Yeast <- Wild Fruit",
	     "crops": {
	      "daoju_item_wheat": 8.565310492505352
	     }
	    },
	    {
	     "label": "Yeast <- Grape",
	     "crops": {
	      "daoju_item_wheat": 8.565310492505352,
	      "daoju_item_grape": 8.565310492505352
	     }
	    },
	    {
	     "label": "Yeast <- Fig",
	     "crops": {
	      "daoju_item_wheat": 8.565310492505352,
	      "daoju_item_fig": 13.333333333333334
	     }
	    },
	    {
	     "label": "Yeast <- Papaya",
	     "crops": {
	      "daoju_item_wheat": 8.565310492505352,
	      "daoju_item_pawpaw": 26.666666666666668
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_BlueLotusWater",
	   "name": "Blue Lotus Nectar",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ZhuJiDan",
	   "name": "Boiled Egg",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_RouTang",
	   "name": "Broth",
	   "variants": [
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_LaJiangHuangChong",
	   "name": "Chili Sauce Locusts",
	   "variants": [
	    {
	     "label": "Chili Sauce Locusts <- Garlic",
	     "crops": {
	      "daoju_item_garlic": 3.3333333333333335
	     }
	    },
	    {
	     "label": "Chili Sauce Locusts <- Chili Sauce",
	     "crops": {
	      "daoju_item_chili": 12.012012012012011
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_JuanYan",
	   "name": "Cigar",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_tobacco": 23.95209580838323
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ShuYuRou",
	   "name": "Cooked Fish",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ShuRou",
	   "name": "Cooked Meat",
	   "variants": [
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ShuHuaSheng",
	   "name": "Cooked Peanut",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_peanut": 3.003003003003003
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ZhuTuDou",
	   "name": "Cooked Potato",
	   "variants": [
	    {
	     "label": "Cooked Potato <- Potato",
	     "crops": {
	      "daoju_item_potatoes": 7.49063670411985
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Spiral_Bread",
	   "name": "Corone",
	   "variants": [
	    {
	     "label": "Yeast <- Wild Fruit",
	     "crops": {
	      "daoju_item_wheat": 34.26124197002141,
	      "daoju_item_date": 66.66666666666667
	     }
	    },
	    {
	     "label": "Yeast <- Grape",
	     "crops": {
	      "daoju_item_wheat": 34.26124197002141,
	      "daoju_item_date": 66.66666666666667,
	      "daoju_item_grape": 21.41327623126338
	     }
	    },
	    {
	     "label": "Yeast <- Fig",
	     "crops": {
	      "daoju_item_wheat": 34.26124197002141,
	      "daoju_item_date": 66.66666666666667,
	      "daoju_item_fig": 33.333333333333336
	     }
	    },
	    {
	     "label": "Yeast <- Papaya",
	     "crops": {
	      "daoju_item_wheat": 34.26124197002141,
	      "daoju_item_date": 66.66666666666667,
	      "daoju_item_pawpaw": 66.66666666666667
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_DateSyrup",
	   "name": "Date Palm Syrup",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_date": 13.333333333333334
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ShuiJiao",
	   "name": "Dumplings",
	   "variants": [
	    {
	     "label": "Dumplings <- Fresh Meat",
	     "crops": {
	      "daoju_item_corn": 12.853470437017995
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Fish_Kasha",
	   "name": "Fish and Wheat Porridge",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_wheat": 17.130620985010705,
	      "daoju_item_chufa": 8.333333333333334
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_YuRouHunGuo",
	   "name": "Fish Hotchpotch",
	   "variants": [
	    {
	     "label": "Fish Hotchpotch <- Premium Fresh Meat",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_YuTang",
	   "name": "Fish Soup",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Fried_Onionrings",
	   "name": "Fried Onion Ring",
	   "variants": [
	    {
	     "label": "Cooking Oil <- Nut",
	     "crops": {
	      "daoju_item_onion": 5,
	      "daoju_item_date": 53.333333333333336,
	      "daoju_item_wheat": 17.130620985010705
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut Seed",
	     "crops": {
	      "daoju_item_onion": 5,
	      "daoju_item_date": 53.333333333333336,
	      "daoju_item_chufa": 13.888888888888891,
	      "daoju_item_wheat": 17.130620985010705
	     }
	    },
	    {
	     "label": "Cooking Oil <- Sesame",
	     "crops": {
	      "daoju_item_onion": 5,
	      "daoju_item_date": 53.333333333333336,
	      "daoju_item_gingeli": 37.48125937031484,
	      "daoju_item_wheat": 17.130620985010705
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut Seed",
	     "crops": {
	      "daoju_item_onion": 5,
	      "daoju_item_date": 53.333333333333336,
	      "daoju_item_peanut": 37.53753753753754,
	      "daoju_item_wheat": 17.130620985010705
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut",
	     "crops": {
	      "daoju_item_onion": 5,
	      "daoju_item_date": 53.333333333333336,
	      "daoju_item_chufa": 41.66666666666667,
	      "daoju_item_wheat": 17.130620985010705
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut",
	     "crops": {
	      "daoju_item_onion": 5,
	      "daoju_item_date": 53.333333333333336,
	      "daoju_item_peanut": 75.07507507507508,
	      "daoju_item_wheat": 17.130620985010705
	     }
	    },
	    {
	     "label": "Cooking Oil <- Cashew",
	     "crops": {
	      "daoju_item_onion": 5,
	      "daoju_item_date": 53.333333333333336,
	      "daoju_item_cashewnuts": 446.42857142857144,
	      "daoju_item_wheat": 17.130620985010705
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ZhaTuDouBao",
	   "name": "Fried Potato Bun",
	   "variants": [
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Cooking Oil <- Nut",
	     "crops": {
	      "daoju_item_potatoes": 18.726591760299623
	     }
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Cooking Oil <- Tigernut Seed",
	     "crops": {
	      "daoju_item_potatoes": 18.726591760299623,
	      "daoju_item_chufa": 13.888888888888891
	     }
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Cooking Oil <- Sesame",
	     "crops": {
	      "daoju_item_potatoes": 18.726591760299623,
	      "daoju_item_gingeli": 37.48125937031484
	     }
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Cooking Oil <- Peanut Seed",
	     "crops": {
	      "daoju_item_potatoes": 18.726591760299623,
	      "daoju_item_peanut": 37.53753753753754
	     }
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Cooking Oil <- Tigernut",
	     "crops": {
	      "daoju_item_potatoes": 18.726591760299623,
	      "daoju_item_chufa": 41.66666666666667
	     }
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Cooking Oil <- Peanut",
	     "crops": {
	      "daoju_item_potatoes": 18.726591760299623,
	      "daoju_item_peanut": 75.07507507507508
	     }
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Cooking Oil <- Cashew",
	     "crops": {
	      "daoju_item_potatoes": 18.726591760299623,
	      "daoju_item_cashewnuts": 446.42857142857144
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_YouZhaNanGuaQuan",
	   "name": "Fried Pumpkin Ring",
	   "variants": [
	    {
	     "label": "Cooking Oil <- Nut",
	     "crops": {
	      "daoju_item_pumpkin": 8.333333333333334
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut Seed",
	     "crops": {
	      "daoju_item_pumpkin": 8.333333333333334,
	      "daoju_item_chufa": 13.888888888888891
	     }
	    },
	    {
	     "label": "Cooking Oil <- Sesame",
	     "crops": {
	      "daoju_item_pumpkin": 8.333333333333334,
	      "daoju_item_gingeli": 37.48125937031484
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut Seed",
	     "crops": {
	      "daoju_item_pumpkin": 8.333333333333334,
	      "daoju_item_peanut": 37.53753753753754
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut",
	     "crops": {
	      "daoju_item_pumpkin": 8.333333333333334,
	      "daoju_item_chufa": 41.66666666666667
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut",
	     "crops": {
	      "daoju_item_pumpkin": 8.333333333333334,
	      "daoju_item_peanut": 75.07507507507508
	     }
	    },
	    {
	     "label": "Cooking Oil <- Cashew",
	     "crops": {
	      "daoju_item_pumpkin": 8.333333333333334,
	      "daoju_item_cashewnuts": 446.42857142857144
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_YouZhaXiYouLeiPai",
	   "name": "Fried Rare Steak",
	   "variants": [
	    {
	     "label": "Fried Rare Steak <- Rare Fresh Meat; Cooking Oil <- Nut",
	     "crops": {}
	    },
	    {
	     "label": "Fried Rare Steak <- Rare Fresh Meat; Cooking Oil <- Tigernut Seed",
	     "crops": {
	      "daoju_item_chufa": 22.222222222222225
	     }
	    },
	    {
	     "label": "Fried Rare Steak <- Rare Fresh Meat; Cooking Oil <- Sesame",
	     "crops": {
	      "daoju_item_gingeli": 59.97001499250374
	     }
	    },
	    {
	     "label": "Fried Rare Steak <- Rare Fresh Meat; Cooking Oil <- Peanut Seed",
	     "crops": {
	      "daoju_item_peanut": 60.06006006006006
	     }
	    },
	    {
	     "label": "Fried Rare Steak <- Rare Fresh Meat; Cooking Oil <- Tigernut",
	     "crops": {
	      "daoju_item_chufa": 66.66666666666667
	     }
	    },
	    {
	     "label": "Fried Rare Steak <- Rare Fresh Meat; Cooking Oil <- Peanut",
	     "crops": {
	      "daoju_item_peanut": 120.12012012012012
	     }
	    },
	    {
	     "label": "Fried Rare Steak <- Rare Fresh Meat; Cooking Oil <- Cashew",
	     "crops": {
	      "daoju_item_cashewnuts": 714.2857142857142
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_YouZhaYuMiJuanBing",
	   "name": "Fried Taco",
	   "variants": [
	    {
	     "label": "Cooking Oil <- Nut; Fresh Meat <- Common Carcass Chunk",
	     "crops": {
	      "daoju_item_corn": 20.565552699228792
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut Seed; Fresh Meat <- Common Carcass Chunk",
	     "crops": {
	      "daoju_item_corn": 20.565552699228792,
	      "daoju_item_chufa": 13.888888888888891
	     }
	    },
	    {
	     "label": "Cooking Oil <- Sesame; Fresh Meat <- Common Carcass Chunk",
	     "crops": {
	      "daoju_item_corn": 20.565552699228792,
	      "daoju_item_gingeli": 37.48125937031484
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut Seed; Fresh Meat <- Common Carcass Chunk",
	     "crops": {
	      "daoju_item_corn": 20.565552699228792,
	      "daoju_item_peanut": 37.53753753753754
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut; Fresh Meat <- Common Carcass Chunk",
	     "crops": {
	      "daoju_item_corn": 20.565552699228792,
	      "daoju_item_chufa": 41.66666666666667
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut; Fresh Meat <- Common Carcass Chunk",
	     "crops": {
	      "daoju_item_corn": 20.565552699228792,
	      "daoju_item_peanut": 75.07507507507508
	     }
	    },
	    {
	     "label": "Cooking Oil <- Cashew; Fresh Meat <- Common Carcass Chunk",
	     "crops": {
	      "daoju_item_corn": 20.565552699228792,
	      "daoju_item_cashewnuts": 446.42857142857144
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ShuiGuoKaoRouChuan",
	   "name": "Fruit Kebab",
	   "variants": [
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Fruit Kebab <- Banana; Fruit Kebab <- Pineapple",
	     "crops": {}
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Fruit Kebab <- Banana; Fruit Kebab <- Grape",
	     "crops": {
	      "daoju_item_grape": 4.282655246252676
	     }
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Fruit Kebab <- Date Palm; Fruit Kebab <- Pineapple",
	     "crops": {
	      "daoju_item_date": 26.666666666666668
	     }
	    },
	    {
	     "label": "Fresh Meat <- Common Carcass Chunk; Fruit Kebab <- Date Palm; Fruit Kebab <- Grape",
	     "crops": {
	      "daoju_item_date": 26.666666666666668,
	      "daoju_item_grape": 4.282655246252676
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_GuoJiu",
	   "name": "Fruit Wine",
	   "variants": [
	    {
	     "label": "Tree Bark <- Log; Yeast <- Wild Fruit; Fruit Wine <- Wild Fruit",
	     "crops": {}
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Grape; Fruit Wine <- Wild Fruit",
	     "crops": {
	      "daoju_item_grape": 8.565310492505352
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Wild Fruit; Fruit Wine <- Grape",
	     "crops": {
	      "daoju_item_grape": 10.70663811563169
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Fig; Fruit Wine <- Wild Fruit",
	     "crops": {
	      "daoju_item_fig": 13.333333333333334
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Wild Fruit; Fruit Wine <- Fig",
	     "crops": {
	      "daoju_item_fig": 16.666666666666668
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Grape; Fruit Wine <- Grape",
	     "crops": {
	      "daoju_item_grape": 19.271948608137045
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Fig; Fruit Wine <- Grape",
	     "crops": {
	      "daoju_item_fig": 13.333333333333334,
	      "daoju_item_grape": 10.70663811563169
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Grape; Fruit Wine <- Fig",
	     "crops": {
	      "daoju_item_grape": 8.565310492505352,
	      "daoju_item_fig": 16.666666666666668
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Papaya; Fruit Wine <- Wild Fruit",
	     "crops": {
	      "daoju_item_pawpaw": 26.666666666666668
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Fig; Fruit Wine <- Fig",
	     "crops": {
	      "daoju_item_fig": 30
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Wild Fruit; Fruit Wine <- Papaya",
	     "crops": {
	      "daoju_item_pawpaw": 33.333333333333336
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Papaya; Fruit Wine <- Grape",
	     "crops": {
	      "daoju_item_pawpaw": 26.666666666666668,
	      "daoju_item_grape": 10.70663811563169
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Grape; Fruit Wine <- Papaya",
	     "crops": {
	      "daoju_item_grape": 8.565310492505352,
	      "daoju_item_pawpaw": 33.333333333333336
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Papaya; Fruit Wine <- Fig",
	     "crops": {
	      "daoju_item_pawpaw": 26.666666666666668,
	      "daoju_item_fig": 16.666666666666668
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Fig; Fruit Wine <- Papaya",
	     "crops": {
	      "daoju_item_fig": 13.333333333333334,
	      "daoju_item_pawpaw": 33.333333333333336
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Papaya; Fruit Wine <- Papaya",
	     "crops": {
	      "daoju_item_pawpaw": 60
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ReKeKe",
	   "name": "Hot Cocoa",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_coco": 52.631578947368425,
	      "daoju_item_chili": 6.006006006006006
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_BingKeKe",
	   "name": "Iced Cocoa",
	   "variants": [
	    {
	     "label": "Nitrate Ore <- Feces; Fire Ash <- Thatch",
	     "crops": {
	      "daoju_item_coco": 131.57894736842107
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Incense",
	   "name": "Incense",
	   "variants": [
	    {
	     "label": "Cooking Oil <- Nut",
	     "crops": {}
	    },
	    {
	     "label": "Cooking Oil <- Tigernut Seed",
	     "crops": {
	      "daoju_item_chufa": 5.555555555555556
	     }
	    },
	    {
	     "label": "Cooking Oil <- Sesame",
	     "crops": {
	      "daoju_item_gingeli": 14.992503748125936
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut Seed",
	     "crops": {
	      "daoju_item_peanut": 15.015015015015015
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut",
	     "crops": {
	      "daoju_item_chufa": 16.666666666666668
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut",
	     "crops": {
	      "daoju_item_peanut": 30.03003003003003
	     }
	    },
	    {
	     "label": "Cooking Oil <- Cashew",
	     "crops": {
	      "daoju_item_cashewnuts": 178.57142857142856
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ShuiGuoZhi",
	   "name": "Juice",
	   "variants": [
	    {
	     "label": "Juice <- Pineapple",
	     "crops": {}
	    },
	    {
	     "label": "Juice <- Grape",
	     "crops": {
	      "daoju_item_grape": 4.282655246252676
	     }
	    },
	    {
	     "label": "Juice <- Fig",
	     "crops": {
	      "daoju_item_fig": 6.666666666666667
	     }
	    },
	    {
	     "label": "Juice <- Guava",
	     "crops": {
	      "daoju_item_pomegranate": 44.44444444444444
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_SachaInchi_Paste",
	   "name": "Mashed Tigernut",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_chufa": 3.3333333333333335
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_FengMiJiu",
	   "name": "Mead",
	   "variants": [
	    {
	     "label": "Tree Bark <- Log; Yeast <- Wild Fruit",
	     "crops": {}
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Grape",
	     "crops": {
	      "daoju_item_grape": 17.130620985010705
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Fig",
	     "crops": {
	      "daoju_item_fig": 26.666666666666668
	     }
	    },
	    {
	     "label": "Tree Bark <- Log; Yeast <- Papaya",
	     "crops": {
	      "daoju_item_pawpaw": 53.333333333333336
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_MeiSiKaErJiu",
	   "name": "Mezcal",
	   "variants": [
	    {
	     "label": "Yeast <- Wild Fruit",
	     "crops": {
	      "daoju_item_agave_leaf": 59.70149253731343
	     }
	    },
	    {
	     "label": "Yeast <- Grape",
	     "crops": {
	      "daoju_item_agave_leaf": 59.70149253731343,
	      "daoju_item_grape": 8.565310492505352
	     }
	    },
	    {
	     "label": "Yeast <- Fig",
	     "crops": {
	      "daoju_item_agave_leaf": 59.70149253731343,
	      "daoju_item_fig": 13.333333333333334
	     }
	    },
	    {
	     "label": "Yeast <- Papaya",
	     "crops": {
	      "daoju_item_agave_leaf": 59.70149253731343,
	      "daoju_item_pawpaw": 26.666666666666668
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Peppermintwater",
	   "name": "Mint Water",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_mint": 3.3333333333333335,
	      "daoju_item_date": 26.666666666666668
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_HunHeGuoJiang",
	   "name": "Mixed Jam",
	   "variants": [
	    {
	     "label": "Mixed Jam <- Onion; Mixed Jam <- Fig; Mixed Jam <- Honey",
	     "crops": {
	      "daoju_item_onion": 10,
	      "daoju_item_fig": 6.666666666666667
	     }
	    },
	    {
	     "label": "Mixed Jam <- Onion; Mixed Jam <- Papaya; Mixed Jam <- Honey",
	     "crops": {
	      "daoju_item_onion": 10,
	      "daoju_item_pawpaw": 13.333333333333334
	     }
	    },
	    {
	     "label": "Mixed Jam <- Salsa; Mixed Jam <- Fig; Mixed Jam <- Honey",
	     "crops": {
	      "daoju_item_chili": 12.012012012012011,
	      "daoju_item_tomatoes": 12.012012012012011,
	      "daoju_item_fig": 6.666666666666667
	     }
	    },
	    {
	     "label": "Mixed Jam <- Salsa; Mixed Jam <- Papaya; Mixed Jam <- Honey",
	     "crops": {
	      "daoju_item_chili": 12.012012012012011,
	      "daoju_item_tomatoes": 12.012012012012011,
	      "daoju_item_pawpaw": 13.333333333333334
	     }
	    },
	    {
	     "label": "Mixed Jam <- Onion; Mixed Jam <- Fig; Mixed Jam <- Date Palm Syrup",
	     "crops": {
	      "daoju_item_onion": 10,
	      "daoju_item_fig": 6.666666666666667,
	      "daoju_item_date": 53.333333333333336
	     }
	    },
	    {
	     "label": "Mixed Jam <- Onion; Mixed Jam <- Papaya; Mixed Jam <- Date Palm Syrup",
	     "crops": {
	      "daoju_item_onion": 10,
	      "daoju_item_pawpaw": 13.333333333333334,
	      "daoju_item_date": 53.333333333333336
	     }
	    },
	    {
	     "label": "Mixed Jam <- Salsa; Mixed Jam <- Fig; Mixed Jam <- Date Palm Syrup",
	     "crops": {
	      "daoju_item_chili": 12.012012012012011,
	      "daoju_item_tomatoes": 12.012012012012011,
	      "daoju_item_fig": 6.666666666666667,
	      "daoju_item_date": 53.333333333333336
	     }
	    },
	    {
	     "label": "Mixed Jam <- Salsa; Mixed Jam <- Papaya; Mixed Jam <- Date Palm Syrup",
	     "crops": {
	      "daoju_item_chili": 12.012012012012011,
	      "daoju_item_tomatoes": 12.012012012012011,
	      "daoju_item_pawpaw": 13.333333333333334,
	      "daoju_item_date": 53.333333333333336
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_MoGuTang",
	   "name": "Mushroom Soup",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Onionsalad",
	   "name": "Onion Salad",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_onion": 5,
	      "daoju_item_gingeli": 2.998500749625187
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Pancake",
	   "name": "Pancake",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_wheat": 34.26124197002141
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ShuRou_2",
	   "name": "Premium Cooked Meat",
	   "variants": [
	    {
	     "label": "Premium Fresh Meat <- Elite Alligator Carcass Chunk",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_YanRouGan_2",
	   "name": "Premium Jerky",
	   "variants": [
	    {
	     "label": "Premium Jerky <- Premium Fresh Meat",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_JianYouZhiRouPai",
	   "name": "Premium Steak",
	   "variants": [
	    {
	     "label": "Premium Steak <- Premium Fresh Meat; Cooking Oil <- Nut",
	     "crops": {}
	    },
	    {
	     "label": "Premium Steak <- Premium Fresh Meat; Cooking Oil <- Tigernut Seed",
	     "crops": {
	      "daoju_item_chufa": 5.555555555555556
	     }
	    },
	    {
	     "label": "Premium Steak <- Premium Fresh Meat; Cooking Oil <- Sesame",
	     "crops": {
	      "daoju_item_gingeli": 14.992503748125936
	     }
	    },
	    {
	     "label": "Premium Steak <- Premium Fresh Meat; Cooking Oil <- Peanut Seed",
	     "crops": {
	      "daoju_item_peanut": 15.015015015015015
	     }
	    },
	    {
	     "label": "Premium Steak <- Premium Fresh Meat; Cooking Oil <- Tigernut",
	     "crops": {
	      "daoju_item_chufa": 16.666666666666668
	     }
	    },
	    {
	     "label": "Premium Steak <- Premium Fresh Meat; Cooking Oil <- Peanut",
	     "crops": {
	      "daoju_item_peanut": 30.03003003003003
	     }
	    },
	    {
	     "label": "Premium Steak <- Premium Fresh Meat; Cooking Oil <- Cashew",
	     "crops": {
	      "daoju_item_cashewnuts": 178.57142857142856
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_MiHuanZhiGuo",
	   "name": "Psychedelic Pot",
	   "variants": [
	    {
	     "label": "Psychedelic Pot <- Mint",
	     "crops": {
	      "daoju_item_mint": 8.333333333333334
	     }
	    },
	    {
	     "label": "Psychedelic Pot <- Cocoa Powder",
	     "crops": {
	      "daoju_item_coco": 131.57894736842107
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_NanGuaShaLa",
	   "name": "Pumpkin Salad",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_pumpkin": 8.333333333333334,
	      "daoju_item_chili": 9.00900900900901,
	      "daoju_item_tomatoes": 6.006006006006006
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_LiMaiZhou",
	   "name": "Quinoa Porridge",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_quinoa": 22.471910112359552
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_ShuRou_3",
	   "name": "Rare Cooked Meat",
	   "variants": [
	    {
	     "label": "Rare Fresh Meat <- Rare Thick Hide Carcass Chunk",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_KaoYuMi",
	   "name": "Roasted Corn",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_corn": 2.570694087403599
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_KaoHuangChong",
	   "name": "Roasted Locusts",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_KaoMoGu",
	   "name": "Roasted Mushroom",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Roasted_Onion",
	   "name": "Roasted Onion",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_onion": 2.5
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_KaoTuDou",
	   "name": "Roasted Potato",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_potatoes": 3.745318352059925
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_KaoNanGua",
	   "name": "Roasted Pumpkin",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_pumpkin": 4.166666666666667
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Roasted_ChuFa",
	   "name": "Roasted Tigernut",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_chufa": 1.6666666666666667
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Turkey_Roast",
	   "name": "Roasted Turkey",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_JiangShuRou",
	   "name": "Sauced Meat",
	   "variants": [
	    {
	     "label": "Sauced Meat <- Garlic; Sauced Meat <- Cooked Meat",
	     "crops": {
	      "daoju_item_garlic": 3.3333333333333335
	     }
	    },
	    {
	     "label": "Sauced Meat <- Chili Sauce; Sauced Meat <- Cooked Meat",
	     "crops": {
	      "daoju_item_chili": 12.012012012012011
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_HaiXianLiMaiFan",
	   "name": "Seafood Quinoa Rice",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_quinoa": 44.943820224719104
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_YanRouGan_3",
	   "name": "Smoked Ham",
	   "variants": [
	    {
	     "label": "Premium Jerky <- Premium Fresh Meat; Cooking Oil <- Nut",
	     "crops": {}
	    },
	    {
	     "label": "Premium Jerky <- Premium Fresh Meat; Cooking Oil <- Tigernut Seed",
	     "crops": {
	      "daoju_item_chufa": 13.888888888888891
	     }
	    },
	    {
	     "label": "Premium Jerky <- Premium Fresh Meat; Cooking Oil <- Sesame",
	     "crops": {
	      "daoju_item_gingeli": 37.48125937031484
	     }
	    },
	    {
	     "label": "Premium Jerky <- Premium Fresh Meat; Cooking Oil <- Peanut Seed",
	     "crops": {
	      "daoju_item_peanut": 37.53753753753754
	     }
	    },
	    {
	     "label": "Premium Jerky <- Premium Fresh Meat; Cooking Oil <- Tigernut",
	     "crops": {
	      "daoju_item_chufa": 41.66666666666667
	     }
	    },
	    {
	     "label": "Premium Jerky <- Premium Fresh Meat; Cooking Oil <- Peanut",
	     "crops": {
	      "daoju_item_peanut": 75.07507507507508
	     }
	    },
	    {
	     "label": "Premium Jerky <- Premium Fresh Meat; Cooking Oil <- Cashew",
	     "crops": {
	      "daoju_item_cashewnuts": 446.42857142857144
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_TuGuoDunLaTang",
	   "name": "Spicy Soup",
	   "variants": [
	    {
	     "label": "Chili Sauce Locusts <- Garlic; Sauced Meat <- Garlic; Sauced Meat <- Cooked Meat",
	     "crops": {
	      "daoju_item_garlic": 13.333333333333334
	     }
	    },
	    {
	     "label": "Chili Sauce Locusts <- Chili Sauce; Sauced Meat <- Garlic; Sauced Meat <- Cooked Meat",
	     "crops": {
	      "daoju_item_chili": 24.024024024024023,
	      "daoju_item_garlic": 6.666666666666667
	     }
	    },
	    {
	     "label": "Chili Sauce Locusts <- Chili Sauce; Sauced Meat <- Chili Sauce; Sauced Meat <- Cooked Meat",
	     "crops": {
	      "daoju_item_chili": 48.048048048048045
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_LongSheLanJiu",
	   "name": "Tequila",
	   "variants": [
	    {
	     "label": "Yeast <- Wild Fruit",
	     "crops": {
	      "daoju_item_agave_leaf": 74.62686567164178
	     }
	    },
	    {
	     "label": "Yeast <- Grape",
	     "crops": {
	      "daoju_item_agave_leaf": 74.62686567164178,
	      "daoju_item_grape": 17.130620985010705
	     }
	    },
	    {
	     "label": "Yeast <- Fig",
	     "crops": {
	      "daoju_item_agave_leaf": 74.62686567164178,
	      "daoju_item_fig": 26.666666666666668
	     }
	    },
	    {
	     "label": "Yeast <- Papaya",
	     "crops": {
	      "daoju_item_agave_leaf": 74.62686567164178,
	      "daoju_item_pawpaw": 53.333333333333336
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_SachaInchi_Cake",
	   "name": "Tigernut Cake",
	   "variants": [
	    {
	     "label": "Cooking Oil <- Nut",
	     "crops": {
	      "daoju_item_chufa": 8.333333333333334,
	      "daoju_item_date": 66.66666666666667
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut Seed",
	     "crops": {
	      "daoju_item_chufa": 22.222222222222225,
	      "daoju_item_date": 66.66666666666667
	     }
	    },
	    {
	     "label": "Cooking Oil <- Sesame",
	     "crops": {
	      "daoju_item_chufa": 8.333333333333334,
	      "daoju_item_date": 66.66666666666667,
	      "daoju_item_gingeli": 37.48125937031484
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut Seed",
	     "crops": {
	      "daoju_item_chufa": 8.333333333333334,
	      "daoju_item_date": 66.66666666666667,
	      "daoju_item_peanut": 37.53753753753754
	     }
	    },
	    {
	     "label": "Cooking Oil <- Tigernut",
	     "crops": {
	      "daoju_item_chufa": 50,
	      "daoju_item_date": 66.66666666666667
	     }
	    },
	    {
	     "label": "Cooking Oil <- Peanut",
	     "crops": {
	      "daoju_item_chufa": 8.333333333333334,
	      "daoju_item_date": 66.66666666666667,
	      "daoju_item_peanut": 75.07507507507508
	     }
	    },
	    {
	     "label": "Cooking Oil <- Cashew",
	     "crops": {
	      "daoju_item_chufa": 8.333333333333334,
	      "daoju_item_date": 66.66666666666667,
	      "daoju_item_cashewnuts": 446.42857142857144
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_YuMiBing",
	   "name": "Tortilla",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_corn": 10.282776349614396
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Turkey_SetMeal",
	   "name": "Turkey Meal",
	   "variants": [
	    {
	     "label": "Turkey Meal <- Turkey Meat; Turkey Meal <- Nut",
	     "crops": {
	      "daoju_item_chili": 12.012012012012011
	     }
	    },
	    {
	     "label": "Turkey Meal <- Turkey Meat; Turkey Meal <- Peanut",
	     "crops": {
	      "daoju_item_chili": 12.012012012012011,
	      "daoju_item_peanut": 15.015015015015015
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Kasha",
	   "name": "Wheat Porridge",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {
	      "daoju_item_wheat": 8.565310492505352
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_Wine",
	   "name": "Wine",
	   "variants": [
	    {
	     "label": "Yeast <- Wild Fruit",
	     "crops": {
	      "daoju_item_grape": 10.70663811563169,
	      "daoju_item_date": 26.666666666666668
	     }
	    },
	    {
	     "label": "Yeast <- Grape",
	     "crops": {
	      "daoju_item_grape": 27.837259100642395,
	      "daoju_item_date": 26.666666666666668
	     }
	    },
	    {
	     "label": "Yeast <- Fig",
	     "crops": {
	      "daoju_item_grape": 10.70663811563169,
	      "daoju_item_date": 26.666666666666668,
	      "daoju_item_fig": 26.666666666666668
	     }
	    },
	    {
	     "label": "Yeast <- Papaya",
	     "crops": {
	      "daoju_item_grape": 10.70663811563169,
	      "daoju_item_date": 26.666666666666668,
	      "daoju_item_pawpaw": 53.333333333333336
	     }
	    }
	   ]
	  },
	  {
	   "id": "DaoJu_Item_MaDaiCha",
	   "name": "Yerba Mate",
	   "variants": [
	    {
	     "label": "Default",
	     "crops": {}
	    }
	   ]
	  }
	 ]
	};
});
