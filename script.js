/*
 * script.js 파일
 * ('최신순' 정렬을 위한 타임스탬프 기능 추가)
 * [수정] 새 항목 추가 시 정확한 DOM 위치에 삽입
 */

// 1. Firebase 설정 (firebase.js 또는 config.js에서 불러옴)
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

    // [A. (수정됨) 링크 불러오기 (Read)]
    linksCollection.orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
        
        const loadingMessage = linkGrid.querySelector('.loading-message');
        if (loadingMessage) loadingMessage.remove();

        snapshot.docChanges().forEach(change => {
            const doc = change.doc;
            const linkData = doc.data();
            
            if (change.type === "added") {
                // * ⬇️ [여기가 1번 수정된 부분입니다] ⬇️
                // createLinkCard에 'newIndex'를 전달하여
                // DOM상의 정확한 위치를 지정할 수 있도록 합니다.
                createLinkCard(doc.id, linkData.title, linkData.url, change.newIndex);
            } 
            else if (change.type === "removed") {
                deleteLinkCard(doc.id);
            }
        });

    }, error => {
        console.error("데이터를 불러오는 데 실패했습니다 (색인이 필요할 수 있습니다):", error);
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

    // [E. 새 링크 '제출' (변경 없음)]
    newLinkForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const title = document.getElementById('link-title').value;
        const url = document.getElementById('link-url').value;

        linksCollection.add({ 
            title: title, 
            url: url,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() 
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

    
    // * ⬇️ [여기가 2번 수정된 부분입니다] ⬇️
    // [G. (수정됨) 링크 카드 생성 (정확한 위치에 삽입)]
    function createLinkCard(id, title, url, index) { // 'index' 인자 추가
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
        
        // [수정됨] 'index'를 기반으로 정확한 위치에 카드를 삽입합니다.
        // '#add-link-card'가 항상 0번째 자식(child)이므로,
        // 데이터 인덱스 0 (newIndex === 0)은 DOM의 1번째 위치(children[1])에 와야 합니다.
        // 즉, (index + 1) 번째 자식 노드 *앞에* 삽입하면 됩니다.
        
        // (index + 1) 번째에 해당하는 자식 노드를 찾습니다.
        const targetNode = linkGrid.children[index + 1]; 
        
        // targetNode가 있으면(undefined가 아니면) 그 앞에 삽입하고 (insertBefore),
        // 없으면(null 또는 undefined) 맨 뒤에 추가합니다 (appendChild와 동일하게 동작).
        linkGrid.insertBefore(card, targetNode || null);
        
        setupSpotlight(card);
        loadFavicon(card, url);

        // 애니메이션을 위한 타이밍 (변경 없음)
        setTimeout(() => {
            card.classList.remove('card-entering');
        }, 10); 
    }


    // [H. (신규) 링크 카드 삭제 (애니메이션 적용) (변경 없음)]
    function deleteLinkCard(id) {
        const card = linkGrid.querySelector(`.link-card[data-id="${id}"]`);
        if (card) {
            card.classList.add('card-exiting');
            card.addEventListener('transitionend', () => {
                card.remove();
            }, { once: true });
        }
    }


    // [I. 스포트라이트 설정 (Helper 함수) (변경 없음)]
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


    // [J. 파비콘 로드 (Helper 함수) (변경 없음)]
    function loadFavicon(card, url) {
        const img = card.querySelector('.card-icon-img');
        if (!img) return;
        try {
            const hostname = new URL(url).hostname;
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=24`;
            img.src = faviconUrl;
            img.onerror = () => {
                img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2QwZDBkMCIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ0Ik0zLjkgMTIuODVjMC0yLjYxIDEuOTctNC44MyA0LjU0LTUuMTlWMTAuNUg3LjI5Yy0uNDIgMC0uNzUuMzQtLjc1Ljc1cy4zMy43NS43NS43NWgxLjE1djEuMjVoLTEuMTljLS40MiAwLS43NS4zNC0uNzUuNzVzLjMzLjc1Ljc1Ljc1aDEuMTl2MS4yNUg3LjI5Yy0uNDIgMC0uNzUuMzQtLjc1Ljc1cy4zMy43NS43NS43NWgxLjE1di4xOUM1Ljg3IDE3LjY4IDMuOSAxNS40NiAzLjkgMTIuODV6TTEyLjUgNy42NnYxLjI1aDEuMTljLjQyIDAgLjc1LS4zNC43NS0uNzVzLS4zMy0uNzUtLjc1LS43NWgtMS4xOXptMCAxMC41aDEuMTljLjQyIDAgLjc1LS43NS43NS0uNzVzLS4zMy0uNzUtLjc1LS43NWgtMS4xOXYtMS4yNWgxLjE5Yy40IgMC0uNzUuNzUuNzV0Ljc1cy0uMzMtLjc1LS43NS0uNzVoLTEuMTl2LTEuMjVoMS4xOWMuNDIgMCAuNzUtLjM0Ljc1LS4zNXMzMy0uNzUtLjc1LS43NWgtMS4xOVY3LjY1YzIuNTcuMzYgNC41NCAyLjU4IDQuNTQgNS4xOXMtMS45NyA0LjgzLTQuNTQgNS4xOVYxOC4xNXpNMTAuODUgMTAuNWgtMS4xOUM5LjI0IDEwLjUgOSAxMC44NCA5IDExLjI1M3MtLjMzLjc1LS43NS43NWgxLjE5di0xLjI1ek0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQxIDAtOC0zLjU5LTgtOHMzLjU5LTggOC04IDggMy41OSA4IDhzLTMuNTkgOC04IDh6Ii8+PC9zdmc+";
            };
        } catch (error) {
            img.onerror();
        }
    }

    // [K. 검색 기능 (변경 없음)]
    searchBox.addEventListener('input', performSearch);
    
    function performSearch() {
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

    // ⬇️ [여기부터 아래 코드를 추가해 주세요] ⬇️

    // [M. 테마 토글 기능]
    const themeToggleBtn = document.getElementById('theme-toggle');

    /**
* 테마를 설정하고 localStorage에 저장하는 함수
     * @param {string} theme - 'dark' 또는 'light'
     */
    function setTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            // 기본은 다크 모드
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }

    // [N. 테마 토글 버튼 클릭 이벤트]
    themeToggleBtn.addEventListener('click', () => {
        // 현재 라이트 모드인지 확인
        const isLightMode = document.body.classList.contains('light-mode');
        // 테마를 반대로 설정
        setTheme(isLightMode ? 'dark' : 'light');
    });

    // [O. 페이지 로드 시 저장된 테마 적용]
    // 저장된 값이 없으면 기본 'dark'
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

}); // DOMContentLoaded 끝