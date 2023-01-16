import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Web3Modal from "web3modal";
import { ethers } from "ethers";

import { marketplaceAddress } from "../config.js";
import NFTMarketplace from "../contracts/NFTMarketplace.json";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

export function ResellNFT() {
    const [formInput, updateFormInput] = useState({ price: "", image: "" });
    const router = useNavigate();
    const { id, tokenURI } = { id: useQuery().get("id"), tokenURI: useQuery().get("tokenURI") };
    const { image, price } = formInput;

    useEffect(() => {
        fetchNFT().then(r => console.log(r));
    }, [id]);

    async function fetchNFT() {
        if (!tokenURI) return;
        const meta = await axios.get(tokenURI);
        updateFormInput(state => ({ ...state, image: meta.data.image }));
    }

    async function listNFTForSale() {
        if (!price) return;
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const priceFormatted = ethers.utils.parseUnits(formInput.price, "ether");
        let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer);
        let listingPrice = await contract.getListingPrice();

        listingPrice = listingPrice.toString();
        let transaction = await contract.resellToken(id, priceFormatted, { value: listingPrice });
        await transaction.wait();

        router("/");
    }

    return (
      <div className="flex justify-center">
          <div className="w-1/2 flex flex-col pb-12">
              <input
                placeholder="Asset Price in Eth"
                className="mt-2 border rounded p-4"
                onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
              />
              {
                image && (
                  <img className="rounded mt-4" width="350" src={image} />
                )
              }
              <button onClick={listNFTForSale} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
                  List NFT
              </button>
          </div>
      </div>
    );
}