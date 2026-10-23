"use client";

import { useMemo, useState } from "react";
import { atozCatalog, ATOZ_LETTERS, AtoZItem, MarketplaceType } from "./lib/atoz-catalog";

interface AtoZDirectoryProps {
  onSelectSearchQuery: (query: string, sector?: string) => void;
  onRequestEnquiry?: (item: AtoZItem) => void;
  initialLetter?: string;
  onClose?: () => void;
}

export default function AtoZDirectory({
  onSelectSearchQuery,
  onRequestEnquiry,
  initialLetter = "ALL",
  onClose,
}: AtoZDirectoryProps) {
  const [selectedLetter, setSelectedLetter] = useState<string>(initialLetter);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<MarketplaceType | "ALL">("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");

  const sectors = useMemo(() => {
    const set = new Set<string>();
    atozCatalog.forEach((item) => set.add(item.sector));
    return Array.from(set).sort();
  }, []);

  // Compute item counts per letter
  const countsPerLetter = useMemo(() => {
    const counts: Record<string, number> = {};
    ATOZ_LETTERS.forEach((l) => (counts[l] = 0));
    atozCatalog.forEach((item) => {
      counts[item.letter] = (counts[item.letter] || 0) + 1;
    });
    return counts;
  }, []);

  // Filter items based on selected criteria
  const filteredItems = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return atozCatalog.filter((item) => {
      if (selectedLetter !== "ALL" && item.letter !== selectedLetter) return false;
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
      if (sectorFilter !== "ALL" && item.sector !== sectorFilter) return false;
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesSector = item.sector.toLowerCase().includes(query);
        const matchesQuery = item.searchQuery.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesSector && !matchesQuery) return false;
      }
      return true;
    });
  }, [selectedLetter, searchFilter, typeFilter, sectorFilter]);

  // Group filtered items by letter
  const groupedItems = useMemo(() => {
    const groups: Record<string, AtoZItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.letter]) groups[item.letter] = [];
      groups[item.letter].push(item);
    });
    return groups;
  }, [filteredItems]);

  const sortedLettersInView = useMemo(() => {
    return Object.keys(groupedItems).sort();
  }, [groupedItems]);

  return (
    <div className="atoz-directory-container" id="atoz-directory">
      {/* Header section */}
      <div className="atoz-header">
        <div className="atoz-header-content">
          <div className="atoz-badge">A TO Z DIRECTORY · COMPLETE INDEX</div>
          <h2 className="atoz-title">
            Explore All Products & Services <em>A to Z</em>
          </h2>
          <p className="atoz-subtitle">
            Navigate our comprehensive directory of {atozCatalog.length} local everyday services, retail products, professional trades and dining.
          </p>
        </div>
        {onClose && (
          <button className="atoz-close-button" onClick={onClose} aria-label="Close A-Z view">
            ✕ Close A–Z
          </button>
        )}
      </div>

      {/* Interactive Alphabet Bar */}
      <div className="atoz-alphabet-bar" aria-label="A to Z Letter Selector">
        <button
          className={`atoz-letter-pill ${selectedLetter === "ALL" ? "active" : ""}`}
          onClick={() => setSelectedLetter("ALL")}
        >
          All ({atozCatalog.length})
        </button>
        {ATOZ_LETTERS.map((letter) => {
          const count = countsPerLetter[letter] || 0;
          const isActive = selectedLetter === letter;
          return (
            <button
              key={letter}
              className={`atoz-letter-pill ${isActive ? "active" : ""} ${count === 0 ? "empty" : ""}`}
              onClick={() => setSelectedLetter(letter)}
              title={`${letter} - ${count} items`}
            >
              <span>{letter}</span>
              <small className="atoz-pill-count">{count}</small>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Controls */}
      <div className="atoz-controls-row">
        <div className="atoz-search-input-wrap">
          <span className="atoz-search-icon">🔍</span>
          <input
            type="text"
            className="atoz-search-input"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Type to filter A–Z (e.g., AC repair, dental, yoga, tailoring, laptop)..."
          />
          {searchFilter && (
            <button className="atoz-clear-search" onClick={() => setSearchFilter("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="atoz-filter-chips">
          {/* Type filter */}
          <div className="atoz-button-group" role="group" aria-label="Filter by type">
            <button
              type="button"
              className={`atoz-filter-chip ${typeFilter === "ALL" ? "selected" : ""}`}
              onClick={() => setTypeFilter("ALL")}
            >
              All Types
            </button>
            <button
              type="button"
              className={`atoz-filter-chip ${typeFilter === "Service" ? "selected" : ""}`}
              onClick={() => setTypeFilter("Service")}
            >
              🛠️ Services
            </button>
            <button
              type="button"
              className={`atoz-filter-chip ${typeFilter === "Product" ? "selected" : ""}`}
              onClick={() => setTypeFilter("Product")}
            >
              🛍️ Products
            </button>
          </div>

          {/* Sector filter */}
          <select
            className="atoz-sector-select"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            aria-label="Filter by sector"
          >
            <option value="ALL">All Sectors ({sectors.length})</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results summary bar */}
      <div className="atoz-status-bar">
        <span>
          Showing <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? "item" : "items"}
          {selectedLetter !== "ALL" && (
            <>
              {" "}
              under letter <strong>“{selectedLetter}”</strong>
            </>
          )}
          {typeFilter !== "ALL" && <> · {typeFilter}s</>}
          {sectorFilter !== "ALL" && <> · {sectorFilter}</>}
        </span>
        {(selectedLetter !== "ALL" || searchFilter || typeFilter !== "ALL" || sectorFilter !== "ALL") && (
          <button
            className="atoz-reset-button"
            onClick={() => {
              setSelectedLetter("ALL");
              setSearchFilter("");
              setTypeFilter("ALL");
              setSectorFilter("ALL");
            }}
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Catalog Grid / Grouped Sections */}
      {filteredItems.length === 0 ? (
        <div className="atoz-empty-state">
          <div className="atoz-empty-icon">⌕</div>
          <h3>No products or services found</h3>
          <p>We couldn't find any items matching your active letter or keyword filters.</p>
          <button
            className="atoz-action-btn primary"
            onClick={() => {
              setSelectedLetter("ALL");
              setSearchFilter("");
              setTypeFilter("ALL");
              setSectorFilter("ALL");
            }}
          >
            Show All A–Z Items
          </button>
        </div>
      ) : (
        <div className="atoz-listings-wrapper">
          {sortedLettersInView.map((letter) => {
            const items = groupedItems[letter];
            return (
              <section key={letter} className="atoz-letter-section">
                <div className="atoz-letter-heading">
                  <span className="atoz-letter-glyph">{letter}</span>
                  <div className="atoz-letter-divider" />
                  <span className="atoz-letter-badge">{items.length} {items.length === 1 ? "item" : "items"}</span>
                </div>

                <div className="atoz-cards-grid">
                  {items.map((item) => (
                    <article key={item.id} className="atoz-card">
                      <div className="atoz-card-top">
                        <span className="atoz-card-icon" role="img" aria-label={item.name}>
                          {item.icon}
                        </span>
                        <div className="atoz-card-tags">
                          <span className={`atoz-tag-type ${item.type.toLowerCase()}`}>{item.type}</span>
                          <span className="atoz-tag-sector">{item.sector}</span>
                          {item.popular && <span className="atoz-tag-popular">★ Popular</span>}
                        </div>
                      </div>

                      <h4 className="atoz-card-title">{item.name}</h4>
                      <p className="atoz-card-desc">{item.description}</p>

                      <div className="atoz-card-footer">
                        <span className="atoz-card-price">{item.priceHint}</span>
                        <div className="atoz-card-actions">
                          {onRequestEnquiry && (
                            <button
                              type="button"
                              className="atoz-card-btn secondary"
                              onClick={() => onRequestEnquiry(item)}
                              title="Quick enquiry for this service"
                            >
                              Enquire
                            </button>
                          )}
                          <button
                            type="button"
                            className="atoz-card-btn primary"
                            onClick={() => onSelectSearchQuery(item.searchQuery, item.sector)}
                            title="Find local businesses nearby"
                          >
                            Find Providers <span>↗</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
