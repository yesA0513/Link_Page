/*
 * script.js 파일
 * ('최신순' 정렬을 위한 타임스탬프 기능 추가)
 */

// 1. Firebase 설정 (변경 없음)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const linksCollection = db.collection("links"); 


// 2. DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', () => {

    const linkGrid = document.getElementById('link-grid');
    const newLinkForm = document.getElementById('new-link-form');
    const searchBox = document.getElementById('search-box');
    const addLinkCard = document.getElementById('add-link-card');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const modalOverlay = document.getElementById('modal-overlay');

    
    function closeModal() {
        modalOverlay.classList.add('hidden');
        newLinkForm.reset();
    }


    // * ⬇️ [수정됨] ⬇️
    // * 정렬 기준을 "title" (제목순) 에서 
    // * "createdAt" (생성 시간), "desc" (내림차순 = 최신순)으로 변경
    // ******************************************************
    linksCollection.orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
        
        const loadingMessage = linkGrid.querySelector('.loading-message');
        if (loadingMessage) loadingMessage.remove();

        snapshot.docChanges().forEach(change => {
            const doc = change.doc;
            const linkData = doc.data();
            
            if (change.type === "added") {
                // [수정됨] createLinkCard가 DOM 순서대로 추가되도록 (항상 맨 뒤)
                createLinkCard(doc.id, linkData.title, linkData.url);
            } 
            else if (change.type === "removed") {
                deleteLinkCard(doc.id);
            }
        });

    }, error => {
        // [중요] 이 'error'에 색인 생성 링크가 포함됩니다.
        console.error("데이터를 불러오는 데 실패했습니다 (색인 필요):", error);
        const loadingMessage = linkGrid.querySelector('.loading-message');
        if (loadingMessage) loadingMessage.innerHTML = '오류: Firebase 색인(Index)이 필요합니다. (F12 개발자 콘솔 확인)';
    });


    // [B. '새 링크 추가' 카드 클릭 (변경 없음)]
    addLinkCard.addEventListener('click', () => {
        modalOverlay.classList.remove('hidden'); 
        document.getElementById('link-title').focus(); 
    });

    // [C. '취소' 버튼 클릭 (변경 없음)]
    cancelAddBtn.addEventListener('click', closeModal);

    // [D. 팝업 배경 클릭 (변경 없음)]
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // [E. 새 링크 '제출']
    newLinkForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const title = document.getElementById('link-title').value;
        const url = document.getElementById('link-url').value;

        // * ⬇️ [수정됨] ⬇️
        // * 데이터를 저장할 때 'createdAt' (생성 시간) 항목을
        // * Firebase의 서버 시간으로 함께 저장합니다.
        // ******************************************************
        linksCollection.add({ 
            title: title, 
            url: url,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // [추가됨]
        })
        .then(() => closeModal())
        .catch(error => console.error("링크 추가 실패:", error));
    });


    // [F. 링크 삭제하기 (Delete) (변경 없음)]
    linkGrid.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            e.preventDefault(); 
            e.stopPropagation(); 
            const linkId = deleteButton.dataset.id; 
            if (confirm("이 링크를 정말 삭제하시겠습니까?")) {
                db.collection("links").doc(linkId).delete()
                .catch(error => console.error("삭제 실패:", error));
            }
        }
    });

    
    // [G. (수정됨) 링크 카드 생성 (애니메이션 클래스 추가)]
    function createLinkCard(id, title, url) {
        const card = document.createElement('article');
        card.className = 'link-card card-entering'; 
        card.dataset.id = id; 

        card.innerHTML = `
            <button class="delete-btn" data-id="${id}">×</button>
            <a href="${url}" target="_blank" rel="noopener noreferrer">
                <img class="card-icon-img" src="" alt="Favicon" width="24" height="24">
                <div class="card-content">
                    <h2>${title}</h2>
                    <p class="card-url">${url}</p>
                </div>
            </a>
        `;
        
        // [수정됨] 항상 '추가' 버튼 뒤, '로딩' 메시지 앞에 오도록
        const loadingMessage = linkGrid.querySelector('.loading-message');
        if (loadingMessage) {
            linkGrid.insertBefore(card, loadingMessage);
        } else {
            linkGrid.appendChild(card);
        }
        
        setupSpotlight(card);
        loadFavicon(card, url);

        setTimeout(() => {
            card.classList.remove('card-entering');
        }, 10); 
    }


    // [H. (신규) 링크 카드 삭제 (애니메이션 적용)]
    function deleteLinkCard(id) {
        const card = linkGrid.querySelector(`.link-card[data-id="${id}"]`);
        if (card) {
            card.classList.add('card-exiting');
            card.addEventListener('transitionend', () => {
                card.remove();
            }, { once: true });
        }
    }


    // [I. 스포트라이트 설정 (Helper 함수)]
    function setupSpotlight(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    }
    
    if (addLinkCard) {
        setupSpotlight(addLinkCard);
    }


    // [J. 파비콘 로드 (Helper 함수)]
    function loadFavicon(card, url) {
        // ... (이 함수는 변경 없음) ...
        const img = card.querySelector('.card-icon-img');
        if (!img) return;
        try {
            const hostname = new URL(url).hostname;
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=24`;
            img.src = faviconUrl;
            img.onerror = () => {
                img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2QwZDBkMCIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0zLjkgMTIuODVjMC0yLjYxIDEuOTctNC44MyA0LjU0LTUuMTlWMTAuNUg3LjI5Yy0uNDIgMC0uNzUuMzQtLjc1Ljc1cy4zMy43NS43NS43NWgxLjE1djEuMjVoLTEuMTljLS40MiAwLS43NS4zNC0uNzUuNzVzLjMzLjc1Ljc1Ljc1aDEuMTl2MS4yNUg3LjI5Yy0uNDIgMC0uNzUuMzQtLjc1Ljc1cy4zMy43NS43NS43NWgxLjE1di4xOUM1Ljg3IDE3LjY4IDMuOSAxNS40NiAzLjkgMTIuODV6TTEyLjUgNy42NnYxLjI1aDEuMTljLjQyIDAgLjc1LS4zNC43NS0uNzVzLS4zMy0uNzUtLjc1LS43NWgtMS4xOXptMCAxMC41aDEuMTljLjQyIDAgLjc1LS43NS43NS0uNzVzLS4zMy0uNzUtLjc1LS43NWgtMS4xOXYtMS4yNWgxLjE5Yy40IgMC0uNzUuNzUuNzV0Ljc1cy0uMzMtLjc1LS43NS0uNzVoLTEuMTl2LTEuMjVoMS4xOWMuNDIgMCAuNzUtLjM0Ljc1LS4zNXMzMy0uNzUtLjc1LS43NWgtMS4xOVY3LjY1YzIuNTcuMzYgNC41NCAyLjU4IDQuNTQgNS4xOXMtMS45NyA0LjgzLTQuNTQgNS4xOVYxOC4xNXpNMTAuODUgMTAuNWgtMS4xOUM5LjI0IDEwLjUgOSAxMC44NCA5IDExLjI1M3MtLjMzLjc1LS43NS43NWgxLjE5di0xLjI1ek0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQxIDAtOC0zLjU5LTgtOHMzLjU5LTggOC04IDggMy41OSA4IDhzLTMuNTkgOC04IDh6Ii8+PC9zdmc+";
            };
        } catch (error) {
            img.onerror();
        }
    }

    // [K. 검색 기능 (변경 없음)]
    searchBox.addEventListener('input', performSearch);
    
    function performSearch() {
        // ... (이 함수는 변경 없음) ...
        const searchTerm = searchBox.value.toLowerCase().trim();
        const allCards = linkGrid.querySelectorAll('.link-card'); 

        allCards.forEach(card => {
            if (card.id === 'add-link-card') {
                card.style.display = ""; 
                return;
            }
            const titleElement = card.querySelector('.card-content h2');
            const urlElement = card.querySelector('.card-url');
            if (!titleElement || !urlElement) return;

            const title = titleElement.textContent.toLowerCase();
            const url = urlElement.textContent.toLowerCase();
            const isMatch = title.includes(searchTerm) || url.includes(searchTerm);
            
            card.style.display = isMatch ? "" : "none";
        });
    }


    // [L. 'ESC' 키로 팝업 닫기 (변경 없음)]
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });

}); // DOMContentLoaded 끝