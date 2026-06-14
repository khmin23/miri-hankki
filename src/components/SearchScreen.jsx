/* ─── 검색 / 키워드 추천 화면 ──────────────────────────── */
import React, { useContext, useRef, useState } from 'react'
import { restaurants } from '../data/restaurants'
import { UserLocCtx } from '../context'
import { getEta } from '../utils'
import { scoreRestaurant } from '../recommend'
import { PhotoThumb, } from './common'
import { TrendingItem } from './cards'

export function SearchScreen({ savedIds, onToggleSave, onSelect }) {
  const userLoc = useContext(UserLocCtx)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [allResults, setAllResults] = useState(null)
  const inputRef = useRef(null)

  function handleSearch() {
    if (!query.trim()) return
    const ranked = restaurants
      .map((item) => ({ item, ...scoreRestaurant(item, query) }))
      .sort((a, b) => b.score - a.score)
    setAllResults(ranked)
    const best = ranked[0]
    if (!best || best.score === 0) {
      setResult({ item: restaurants[0], matches: [], reason: '질문이 아직 구체적이지 않아서 가장 무난한 곳을 먼저 골랐어요.' })
    } else {
      setResult({ item: best.item, matches: best.matches, reason: best.reason })
    }
  }

  const exampleQueries = [
    '오늘 비 오는데 따뜻한 국물 뭐가 좋을까?',
    '광안리 데이트 코스 추천해줘',
    '혼자 가기 좋은 점심 맛집',
    '분위기 좋은 카페 어디 있어?',
  ]

  return (
    <div className="search-screen">
      <div className="search-header-bar">
        <div className="search-input-wrap">
          <span>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="지역, 음식, 맛집을 검색해보세요"
          />
          {query && <button className="clear-btn" onClick={() => { setQuery(''); setResult(null); setAllResults(null) }}>✕</button>}
        </div>
        <button className="search-go-btn" onClick={handleSearch}>검색</button>
      </div>

      {!result && (
        <>
          <div className="keyword-section">
            <div className="keyword-badge">🔍 키워드 추천</div>
            <h3>어떤 분위기로 찾으세요?</h3>
            <p className="keyword-desc">음식, 분위기, 상황을 입력하면 태그와 연결해 맞는 맛집을 찾아드려요.</p>
            <div className="example-queries">
              {exampleQueries.map((q) => (
                <button key={q} className="example-chip" onClick={() => { setQuery(q) }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <section className="home-section" style={{ marginTop: 8 }}>
            <div className="section-header"><h2>전체 맛집</h2></div>
            <div className="trending-list">
              {restaurants.map((item) => (
                <TrendingItem key={item.id} item={item} saved={savedIds.includes(item.id)} onToggleSave={onToggleSave} onSelect={onSelect} />
              ))}
            </div>
          </section>
        </>
      )}

      {result && (
        <div className="ai-result-area">
          <div className="ai-best-card" onClick={() => onSelect(result.item.id)}>
            <div className="ai-best-photo">
              <PhotoThumb item={result.item} />
              <div className="ai-best-badge">🔍 키워드 매칭</div>
            </div>
            <div className="ai-best-body">
              <strong>{result.item.name}</strong>
              <p className="ai-reason">{result.reason}</p>
              {result.matches?.length > 0 && (
                <div className="matched-tags">
                  {result.matches.map((m) => (
                    <span key={m} className="matched-tag">#{m}</span>
                  ))}
                </div>
              )}
              {getEta(result.item, userLoc) && <p className="item-eta">{getEta(result.item, userLoc)}</p>}
            </div>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <h2>추천 결과</h2>
            <button className="see-more" onClick={() => { setResult(null); setAllResults(null); setQuery('') }}>다시 검색</button>
          </div>
          <div className="ai-result-grid">
            {allResults?.slice(0, 3).map(({ item, matches }) => (
              <article key={item.id} className="ai-result-card" onClick={() => onSelect(item.id)}>
                <div className="ai-result-img"><PhotoThumb item={item} /></div>
                <p className="rec-location">{item.location}</p>
                <strong>{item.name.length > 8 ? item.name.slice(0, 8) + '…' : item.name}</strong>
                {matches?.length > 0 && (
                  <div className="matched-tags" style={{ marginTop: 4 }}>
                    {matches.slice(0, 2).map((m) => (
                      <span key={m} className="matched-tag">#{m}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
